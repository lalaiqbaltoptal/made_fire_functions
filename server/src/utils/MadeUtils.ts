export class MadeUtils {
  static get id() {
    const length = 20;
    let result = '';
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;

    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  static listContain(ref: any, arr: any[]) {
    let isContain = false;
    arr.forEach((item) => {
      if (item == ref) {
        isContain = true;
      }
    });
    return isContain;
  }
}
