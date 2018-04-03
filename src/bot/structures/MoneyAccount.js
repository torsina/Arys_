const FriendlyError = require("./FriendlyError");
class MoneyAccount {
    constructor(data = {}, guildSetting) {
        this.amount = data.amount || guildSetting.money.accounts.amount;

        this.daily = {};
        if (data.daily) {
            this.daily.lastGet = data.daily.lastGet || 0;
        } else {
            this.daily.lastGet = 0;
        }
        this.getDaily = (hasBonus = false) => {
            const { lastGet } = this.daily;
            const timestamp = new Date().getTime();
            if ((lastGet + 86400000) < timestamp) throw "daily.tooSoon";
            const { min, max } = guildSetting.money.daily.bonusRange;
            const addedMoney = guildSetting.money.daily.amount + (hasBonus ? Math.floor(Math.random() * (max - min + 1) + min) : 0);
            this.amount += addedMoney;
            this.daily.lastGet = timestamp;
            return addedMoney;
        };

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
        if (result < 0 && force === false) throw new FriendlyError("money.tooPoor");
        this.amount = result;
        return result;
    }
    setActivityCooldown(value = Date.now()) {
        if (typeof value !== "number") throw new TypeError("value is not a number");
        this.activity.lastGet = value;
    }
}
module.exports = MoneyAccount;