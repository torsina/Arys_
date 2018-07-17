const constant = require("../../util/constants").GUILDSETTING_DEFAULT;
const misc = require("../../util/misc");
const { money } = constant;
class MoneySetting {
    constructor(data = {}) {
        this.name = data.name || money.name;
        this.accounts = {};
        if (data.accounts) {
            this.accounts = {
                baseAmount: data.accounts.baseAmount || money.accounts.baseAmount
            };
        } else {
            misc.mergeDeep(this.accounts, money.accounts);
        }

        this.bet = {};
        if (data.bet) {
            this.bet = {
                multiplier: money.bet.multiplier,
                min: data.bet.min || money.bet.min,
                max: data.bet.max || money.bet.max
            };
        } else {
            misc.mergeDeep(this.bet, money.bet);
        }

        this.daily = {};
        if (data.daily) {
            this.daily.amount = data.daily.amount || money.daily.amount;
            if (data.daily.bonusRange) {
                this.daily.bonusRange = {
                    min: data.daily.bonusRange.min || money.daily.bonusRange.min,
                    max: data.daily.bonusRange.max || money.daily.bonusRange.max
                };
            } else {
                misc.mergeDeep(this.daily.bonusRange, money.daily.bonusRange);
            }
        } else {
            misc.mergeDeep(this.daily, money.daily);
        }

        this.activity = {};
        if (data.activity) {
            this.activity = {
                wait: data.activity.wait || money.activity.wait,
                min: data.activity.min || money.activity.min,
                max: data.activity.max || money.activity.max
            };
        } else {
            misc.mergeDeep(this.activity, money.activity);
        }
    }
    setName(value) {
        if (typeof value !== "string") throw new TypeError("value is not a string");
        this.name = value;

    }
    setAccountsAmount(value) {
        if (typeof value !== "number") throw new TypeError("value is not a string");
        this.accounts.amount = value;
    }
    setBetRange(value = {}) {
        if (typeof value !== "object") throw new TypeError("value is not an object");
        const { min, max } = value;
        this.bet.min = min ? min : this.bet.min;
        this.bet.max = max ? max : this.bet.max;
    }
    setDailyAmount(value) {
        this.daily.amount = value;
    }
    setDailyBonusRange(value = {}) {
        if (typeof value !== "object") throw new TypeError("value is not an object");
        const { min, max } = value;
        this.daily.bonusRange.min = min ? min : this.daily.bonusRange.min;
        this.daily.bonusRange.max = max ? max : this.daily.bonusRange.max;
    }
    setActivityWait(value) {
        this.activity.wait = value;
    }
    setActivityRange(value = {}) {
        if (typeof value !== "object") throw new TypeError("value is not an object");
        const { min, max } = value;
        this.activity.min = min ? min : this.activity.min;
        this.activity.max = max ? max : this.activity.max;
    }
}
module.exports = MoneySetting;