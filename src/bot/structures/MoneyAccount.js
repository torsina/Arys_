class MoneyAccount {
    constructor(data = {}, GuildSetting) {
        this.amount = data.amount || GuildSetting.money.accounts.amount;

        this.daily = {};
        if (data.daily) {
            this.daily.lastGet = data.daily.lastGet || 0;
        } else {
            this.daily.lastGet = 0;
        }

        this.bet = {};
        if (data.bet) {
            this.bet.amount = data.bet.amount || 0;
        } else {
            this.bet.amount = 0;
        }

        this.activity = {};
        if (data.activity) {
            this.activity.lastGet = data.activity.lastGet || 0;
        } else {
            this.activity.lastGet = 0;
        }
    }
    editMoney(value, force = false) {
        const result = this.amount + value;
        if (result < 0 && force === false) throw new Error("money.tooPoor");
        this.amount = result;
        return result;
    }
    setActivityCooldown(value = Date.now()) {
        if (typeof value !== "number") throw new TypeError("value is not a number");
        this.activity.lastGet = value;
    }
}
module.exports = MoneyAccount;