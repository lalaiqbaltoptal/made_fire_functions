import { SubscriptionDto } from 'src/dtos/subscription.dto';
import { StripeSession } from './stripe_session';

export class UserPackages {
  subscription: SubscriptionDto;
  checkoutSession: StripeSession;
}
