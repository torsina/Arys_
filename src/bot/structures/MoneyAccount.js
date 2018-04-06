const FriendlyError = require("./FriendlyError");
class MoneyAccount {
    constructor(data = {}, guildSetting) {
        this._guildSetting = guildSetting;
        this.amount = data.amount || guildSetting.money.accounts.amount;

        this.daily = {};
        if (data.daily) {
            this.daily.lastGet = data.daily.lastGet || 0;
            if (isNaN(this.daily.lastGet)) this.daily.lastGet = 0;
        } else {
            this.daily.lastGet = 0;
        }
        Object.defineProperty(this.daily, "isAvailable", {
            get: () => {
                return (this.daily.lastGet + 86400000) < new Date().getTime();
            }
        });

        this.bet = {};
        if (data.bet) {
            this.bet.amount = data.bet.amount || 0;
        } else {
            this.bet.amount = 0;
        }

        this.activity = {};
        if (data.activity) {
            this.activity.lastGet = data.activity.lastGet || 0;
            if (isNaN(this.activity.lastGet)) this.activity.lastGet = 0;
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
    setDailyCooldown() {
        this.daily.lastGet = new Date().getTime();
    }

    getDaily(hasBonus = false) {
        const { lastGet } = this.daily;
        const timestamp = new Date().getTime();
        const { min, max } = this._guildSetting.money.daily.bonusRange;
        const addedMoney = this._guildSetting.money.daily.amount + (hasBonus ? Math.floor(Math.random() * (max - min + 1) + min) : 0);
        this.amount += addedMoney;
        this.daily.lastGet = timestamp;
        return addedMoney;
    }
    _deleteGuildSetting() {
        const save = this._guildSetting;
        delete this._guildSetting;
        return save;
    }
    _reloadGuildSetting(setting) {
        this._guildSetting = setting;
    }
}
module.exports = MoneyAccount;