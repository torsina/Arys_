const constant = require("../../util/constants").GUILDSETTING_DEFAULT;
const misc = require("../../util/misc");
const { money } = constant;
class MoneySetting {
    constructor(data) {
        if (data) {
            this._data = data;
            this.name = data.name || money.name;
            this.accounts = {};
            if (data.accounts) {
                this.accounts = {
                    baseAmount: data.baseAmount || money.baseAmount
                };
            } else {
                misc.mergeDeep(this.accounts, money.accounts);
            }

            this.bet = {};
            if (data.bet) {
                this.bet = {
                    multiplier: money.bet.multiplier,
                    min: data.bet.min || money.bet.min,
                    max: data.bet.max || money.bet.max,
                    used: data.bet.used || money.bet.used
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
        } else {
            this._data = {};
            misc.mergeDeep(this, money);
        }
    }
    setName(value) {
        if (value === money.name) {
            delete this._data.name;
            this.name = value;
        } else {
            if (typeof value !== "string") throw new TypeError("value is not a string");
            this._data.name = value;
            this.name = value;
        }
    }
    setAccountsAmount(value) {
        if (value === money.accounts.amount) {
            if (this._data.accounts) {
                delete this._data.accounts.amount;
            }
            if (Object.keys(this._data.accounts).length === 0) {
                delete this._data.accounts;
                if (Object.keys(this._data).length === 0) {
                    this._data = {};
                }
            }
            this.baseAmount = value;
        } else {
            if (typeof value !== "number") throw new TypeError("value is not a string");
            if (!this._data.accounts) this._data.accounts = {};
            this._data.accounts.amount = value;
            this.accounts.amount = value;
        }
    }
    setBetRange(value = {}) {
        const { min, max } = value;
        if (min === money.bet.min) {
            if (this._data.bet) this._data.bet.min = undefined;
            this.bet.min = min;
        }
        if (max === money.bet.max) {
            if (this._data.bet) this._data.bet.max = undefined;
            this.bet.max = max;
        }
        if (min !== money.bet.min && max !== money.bet.max) {
            if (typeof value !== "object") throw new TypeError("value is not an object");
            if (!this._data.bet) this._data.bet = {};
            if (min) {
                this._data.bet.min = min;
                this.bet.min = min;
            }
            if (max) {
                this._data.bet.max = max;
                this.bet.max = max;
            }
        }
        if (Object.keys(this._data.bet).length === 0) {
            delete this._data.bet;
            if (Object.keys(this._data).length === 0) {
                this._data = {};
            }
        }
    }
    addBetUsed(value) {
        if (!this._data.bet) this._data.bet = {};
        this._data.bet.used += value;
        this.bet.used += value;
        return this._data.bet.used;
    }
    setDailyAmount(value) {
        if (value === money.daily.amount) {
            if (this._data.daily) this._data.daily.amount = undefined;
        } else {
            if (!this._data.daily) this._data.daily = {};
            this._data.daily.amount = value;
        }
        if (Object.keys(this._data.daily).length === 0) {
            delete this._data.daily;
            if (Object.keys(this._data).length === 0) {
                this._data = {};
            }
        }
        this.daily.amount = value;
    }
    setDailyBonusRange(value = {}) {
        const { min, max } = value;
        if (min === money.daily.bonusRange.min) {
            if (this._data.daily.bonusRange) this._data.daily.bonusRange.min = undefined;
            this.daily.bonusRange.min = min;
        }
        if (max === money.daily.bonusRange.max) {
            if (this._data.daily.bonusRange) this._data.daily.bonusRange.max = undefined;
            this.daily.bonusRange.max = max;
        }
        if (min !== money.daily.bonusRange.min && max !== money.daily.bonusRange.max) {
            if (typeof value !== "object") throw new TypeError("value is not an object");
            if (!this._data.daily) this._data.daily = {};
            if (!this._data.daily.bonusRange) this._data.daily.bonusRange = {};
            if (min) {
                this._data.daily.bonusRange.min = min;
                this.daily.bonusRange.min = min;
            }
            if (max) {
                this._data.daily.bonusRange.max = max;
                this.daily.bonusRange.max = max;
            }
        }
        if (Object.keys(this._data.daily.bonusRange).length === 0) {
            delete this._data.daily.bonusRange;
            if (Object.keys(this._data.daily).length === 0) {
                delete this._data.daily;
                if (Object.keys(this._data).length === 0) {
                    this._data = {};
                }
            }
        }
    }
    setActivityWait(value) {
        if (value === money.activity.wait) {
            if (this._data.activity) this._data.activity.wait = undefined;
        } else {
            if (!this._data.activity) this._data.activity = {};
            this._data.activity.wait = value;
        }
        if (Object.keys(this._data.activity).length === 0) {
            delete this._data.activity;
            if (Object.keys(this._data).length === 0) {
                this._data = {};
            }
        }
        this.activity.wait = value;
    }
    setActivityRange(value = {}) {
        const { min, max } = value;
        if (min === money.activity.min) {
            if (this._data.activity) this._data.activity.min = undefined;
            this.activity.min = min;
        }
        if (max === money.activity.max) {
            if (this._data.activity) this._data.activity.max = undefined;
            this.activity.max = max;
        }
        if (min !== money.activity.min && max !== money.activity.max) {
            if (typeof value !== "object") throw new TypeError("value is not an object");
            if (!this._data.activity) this._data.activity = {};
            if (min) {
                this._data.activity.min = min;
                this.activity.min = min;
            }
            if (max) {
                this._data.activity.max = max;
                this.activity.max = max;
            }
        }
        if (Object.keys(this._data.activity).length === 0) {
            delete this._data.activity;
            if (Object.keys(this._data).length === 0) {
                this._data = {};
            }
        }
    }
}
module.exports = MoneySetting;