/*
https://docs.nestjs.com/providers#services
*/

import {
  BadRequestException,
  Injectable,
  NotFoundException,
  RawBodyRequest,
} from '@nestjs/common';
import { ResponseModel } from 'src/models/response.model';
import { InjectStripe } from 'nestjs-stripe';
import Stripe from 'stripe';
import { FireAdminService } from 'src/services/fire-admin.service';
import { FireCollection } from 'src/constants/fireCollection';
import { StripeCustomer } from 'src/models/stripe_customer';
import { CustomerData } from 'src/interface/stripe_customer_data';
import { SubscriptionDto } from 'src/dtos/subscription.dto';
import { SubscriptionInterval } from 'src/constants/subscription.interval';
import { SetupModel } from 'src/models/setup.model';
import { Environment } from 'src/config/enviroment';
import { Request } from 'express';
import { StripeSession } from 'src/models/stripe_session';
import { StripeSessionStatus } from 'src/constants/stripe_sesstion_status';
import { StripeTransaction } from 'src/models/stripe_transaction';
import { PaymentStatus } from 'src/enums/payment.status';
import { CoachingModel } from 'src/models/coaching.model';
import { UserPackages } from 'src/models/user_packages.model';
@Injectable()
export class PaymentService {
  public constructor(
    private fireService: FireAdminService,
    @InjectStripe() private readonly stripeClient: Stripe,
  ) {}

  async stripeWebHook(body, req: RawBodyRequest<Request>) {
    const endpointSecret = Environment.stripeEndPointSec;
    // await this.fireService.postData('web_hook_data', body);
    const sig = req.headers['stripe-signature'];

    let event: Stripe.Event = body;

    try {
      event = this.stripeClient.webhooks.constructEvent(
        req.rawBody,
        sig,
        endpointSecret,
      );
    } catch (err) {
      await this.fireService.postData('web_hook_err', body);

      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    let session;

    switch (event.type) {
      case 'checkout.session.async_payment_failed':
        session = event.data.object;
        // Then define and call a function to handle the event checkout.session.async_payment_failed
        break;
      case 'checkout.session.async_payment_succeeded':
        session = event.data.object;
        await this.applyCompletionLogic(session);
        // Then define and call a function to handle the event checkout.session.async_payment_succeeded
        break;
      case 'checkout.session.completed':
        session = event.data.object;
        session = event.data.object;

        await this.applyCompletionLogic(session);
        // await this.fireService.updateData(
        //   FireCollection.stripe_session,
        //   { status: StripeSessionStatus.COMPLETED },
        //   session.id,
        // );
        // // Then define and call a function to handle the event checkout.session.completed
        break;
      case 'checkout.session.expired':
        session = event.data.object;

        await this.fireService.updateData(
          FireCollection.stripe_session,
          { status: StripeSessionStatus.EXPIRED },
          session.id,
        );
        // Then define and call a function to handle the event checkout.session.expired
        break;
      case 'payment_intent.created':
        const paymentIntent = event.data.object;
        // Then define and call a function to handle the event payment_intent.succeeded
        break;
      // ... handle other event types
      default:
        throw new BadRequestException('Invalid event type');
      //  console.log(`Unhandled event type ${event.type}`);
    }
  }
  private async applyCompletionLogic(session) {
    const userSessions: StripeSession[] = await (
      await this.fireService
        .getQuery(FireCollection.stripe_session)
        .where('userId', '==', session.metadata.userId)
        .get()
    ).docs.map((e) => {
      const obj: StripeSession = {} as StripeSession;
      obj.id = e.id;
      Object.assign(obj, e.data());
      return obj;
    });
    const sessionsIdsToMakeExp: string[] = userSessions
      .filter((item) => item.status == StripeSessionStatus.PENDING)
      .filter((item) => item.sessionId != session.id)
      .map((e) => e.sessionId);
    const coaching: CoachingModel[] = (
      await this.fireService
        .getQuery(FireCollection.coaching)
        .where('userId', '==', session.metadata.userId)
        .get()
    ).docs.map((e) => {
      const obj: CoachingModel = {} as CoachingModel;
      Object.assign(obj, e.data(), { id: e.id });
      return obj;
    });
    const stripeTrsaction: StripeTransaction = {} as StripeTransaction;
    if (coaching.length == 0) {
      stripeTrsaction.status = PaymentStatus.success_but_invalid;
      stripeTrsaction.message =
        'Payment made but must be returned, payment was made for invalid coaching id, or coaching id not found';
      stripeTrsaction.userId = session.metadata.userId;
    } else {
      stripeTrsaction.status = PaymentStatus.success;
      stripeTrsaction.message = 'Payment was made for a valid user journey';
      stripeTrsaction.userId = session.metadata.userId;
      const coachingToUpdate: CoachingModel = coaching[0];

      coachingToUpdate.activePlan = session.metadata.subscriptionId;

      await this.fireService.updateData(
        FireCollection.coaching,
        coachingToUpdate,
        coachingToUpdate.id,
      );
    }
    await this.fireService.postData(
      FireCollection.stripe_transaction,
      stripeTrsaction,
    );

    await this.fireService.updateData(
      FireCollection.stripe_session,
      { status: StripeSessionStatus.COMPLETED },
      session.id,
    );
    //
    for (let i = 0; i < sessionsIdsToMakeExp.length; i++) {
      await this.stripeClient.checkout.sessions.expire(sessionsIdsToMakeExp[i]);
    }
  }
  async createSubScription(
    subscription: SubscriptionDto,
  ): Promise<ResponseModel> {
    this.validateInterval(subscription.interval, SubscriptionInterval.toList);
    const stripeProduct = await this.stripeClient.products.create({
      name: subscription.title,
      description: subscription.description,
      type: 'service',
      active: true,
      metadata: {
        percentageBaseValue: subscription.percentageBaseValue,
        subscriptionRange: subscription.interval,
      },
    });
    subscription.stripeProductId = stripeProduct.id;
    await this.fireService.postData(FireCollection.subscription, subscription);
    return {
      message: 'Subscription created',
      success: true,
      data: subscription,
      count: undefined,
    };
  }
  async updateSubscription(
    subscription: SubscriptionDto,
  ): Promise<ResponseModel> {
    this.validateInterval(subscription.interval, SubscriptionInterval.toList);
    const stripeProduct = await this.stripeClient.products.update(
      subscription.stripeProductId,
      {
        name: subscription.title,
        description: subscription.description,
        active: true,
        metadata: {
          percentageBaseValue: subscription.percentageBaseValue,
          subscriptionRange: subscription.interval,
        },
      },
    );
    subscription.stripeProductId = stripeProduct.id;
    await this.fireService.updateData(
      FireCollection.subscription,
      subscription,
      subscription.id,
    );
    return {
      message: 'Subscription created',
      success: true,
      data: subscription,
      count: undefined,
    };
  }
  async userData(userId: string): Promise<ResponseModel> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let stripeUser: StripeCustomer = (
      await this.fireService.getById(FireCollection.stripe_user, userId).get()
    ).data() as StripeCustomer;
    if (!stripeUser) {
      stripeUser = {
        stripeId: undefined,
        stripeLink: undefined,
      };
      let userRecord;
      try {
        userRecord = await this.fireService.getUserData(userId);
      } catch (err) {
        if (err.code == 'auth/user-not-found') {
          throw new NotFoundException('Invalid USER ID, user not found');
        }

        throw new BadRequestException('Please try again');
      }

      const customerData: CustomerData = {
        metadata: {
          firebaseUID: userId,
        },
      };
      if (userRecord.email) {
        customerData.email = userRecord.email;
      }
      if (userRecord.phoneNumber) {
        customerData.phone = userRecord.phoneNumber;
      }
      const customer = await this.stripeClient.customers.create(customerData);
      if (userRecord.email) {
        stripeUser.email = userRecord.email;
      }
      if (userRecord.phoneNumber) {
        stripeUser.phone = userRecord.phoneNumber;
      }
      stripeUser.stripeId = customer.id;
      stripeUser.stripeLink = `https://dashboard.stripe.com${
        customer.livemode ? '' : '/test'
      }/customers/${customer.id}`;
      await this.fireService.postData(
        FireCollection.stripe_user,
        stripeUser,
        userId,
      );
    }
    return {
      count: undefined,
      message: 'User loaded',
      success: true,
      data: stripeUser,
    };
  }
  async userPackages(userId: string): Promise<ResponseModel> {
    const userPackages: UserPackages[] = [];
    const subscriptions: SubscriptionDto[] = await (
      await this.fireService.getAll(FireCollection.subscription)
    ).docs.map((e) => {
      const obj: SubscriptionDto = {} as SubscriptionDto;
      Object.assign(obj, e.data(), { id: e.id });
      return obj;
    });

    const checkouts: StripeSession[] = (
      await Promise.all(
        subscriptions.map((sub) => {
          return this.checkoutSession(userId, null, sub);
        }),
      )
    ).map((e) => e.data as StripeSession);
    checkouts.sort((a, b) => a.amount - b.amount);
    checkouts.forEach((item) => {
      userPackages.push({
        checkoutSession: item,
        subscription: subscriptions.filter(
          (sub) => sub.id == item.subscriptionId,
        )[0],
      });
    });
    return {
      data: userPackages,
      count: undefined,
      message: 'Loaded successfully',
      success: true,
      error: undefined,
    };
  }
  async checkoutSession(
    userId: string,
    subscriptionId: string,
    subscriptionsDto?: SubscriptionDto,
  ): Promise<ResponseModel> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const coaching = (
      await this.fireService
        .getQuery(FireCollection.coaching)
        .where('userId', '==', userId)
        .get()
    ).docs;
    if (coaching.length == 0) {
      throw new BadRequestException('End node not selected');
    }
    const endNodeId = coaching[0].data().endNodeId;

    const endNode: SetupModel = (
      await this.fireService.getById(FireCollection.setup, endNodeId).get()
    ).data() as SetupModel;
    if (!endNode) {
      throw new BadRequestException('Invalid coaching selection');
    }
    const subscription: SubscriptionDto =
      subscriptionsDto != null
        ? subscriptionsDto
        : ((
            await this.fireService
              .getById(FireCollection.subscription, subscriptionId)
              .get()
          ).data() as SubscriptionDto);
    if (subscriptionsDto == null) {
      subscription.id = subscriptionId;
    }
    if (!subscription) {
      throw new BadRequestException('Invalid subscription id');
    }
    const price: number = parseFloat(
      ((subscription.percentageBaseValue / 100) * endNode.price * 100).toFixed(
        2,
      ),
    );

    const stripeUser: StripeCustomer = (await (
      await this.userData(userId)
    ).data) as StripeCustomer;
    const priceData = (
      await this.stripeClient.prices.search({
        query: `metadata['price']:'${price}' AND product:'${subscription.stripeProductId}' AND active:'true'`,
      })
    ).data;

    const userSessions: StripeSession[] = await (
      await this.fireService
        .getQuery(FireCollection.stripe_session)
        .where('userId', '==', userId)
        .get()
    ).docs.map((e) => {
      const obj: StripeSession = {} as StripeSession;
      obj.id = e.id;
      Object.assign(obj, e.data());
      return obj;
    });

    let stripePrice: Stripe.Price;
    if (priceData.length == 0) {
      stripePrice = await this.stripeClient.prices.create({
        currency: 'usd',
        metadata: {
          price: price,
        },
        active: true,
        product: subscription.stripeProductId,
        recurring: {
          interval:
            SubscriptionInterval.YEAR as Stripe.PriceCreateParams.Recurring.Interval,
          interval_count: 1,
        },
        billing_scheme: 'per_unit',
        unit_amount: price,
      });
    } else {
      stripePrice = priceData[0];
    }
    let activeSession: StripeSession;
    userSessions.forEach((item) => {
      if (item.status == StripeSessionStatus.PENDING) {
        if (
          item.priceId == stripePrice.id &&
          item.productId == subscription.stripeProductId
        ) {
          activeSession = item;
        }
      }
    });

    if (activeSession) {
      return {
        message: 'Loaded',
        count: undefined,
        success: true,
        data: activeSession,
      };
    }
    const session = await this.stripeClient.checkout.sessions.create({
      payment_method_types: ['card'],
      customer: stripeUser.stripeId,
      metadata: {
        productId: subscription.stripeProductId,
        priceId: stripePrice.id,
        userId: userId,
        subscriptionId: subscription.id,
      },
      line_items: [
        {
          price: stripePrice.id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: 'https://example.com/success',
      cancel_url: 'https://example.com/cancel',
      // consent_collection: {
      //   terms_of_service: 'required',
      // },
    });

    await this.fireService.postData(
      FireCollection.stripe_session,
      this.fireCheckoutData(session),
      session.id,
    );
    return {
      count: undefined,
      message: 'Checkout loaded',
      success: true,
      data: this.fireCheckoutData(session),
    };
  }

  private validateInterval(value: string, contains: string[]) {
    let isContains = false;
    for (let i = 0; i < contains.length; i++) {
      if (contains[i] == value) {
        isContains = true;
      }
    }
    if (!isContains) {
      throw new BadRequestException(`Must contains ${contains}`);
    }
  }
  private fireCheckoutData(stripeData: Stripe.Checkout.Session) {
    const obj: StripeSession = {} as StripeSession;
    obj.productId = stripeData.metadata.productId;
    obj.priceId = stripeData.metadata.priceId;
    obj.userId = stripeData.metadata.userId;
    obj.sessionId = stripeData.id;
    obj.status = StripeSessionStatus.PENDING;
    obj.amount = stripeData.amount_total;
    obj.url = stripeData.url;
    obj.subscriptionId = stripeData.metadata.subscriptionId;
    obj.stripe_customerId = stripeData.customer as string;
    return obj;
  }
}
