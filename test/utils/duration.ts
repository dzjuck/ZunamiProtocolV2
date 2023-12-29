import { BigNumber as BN } from '@ethersproject/bignumber/lib/bignumber';

export const duration = {
    seconds: function (val: number) {
        return BN.from(val);
    },
    minutes: function (val: number) {
        return BN.from(val).mul(this.seconds(60));
    },
    hours: function (val: number) {
        return BN.from(val).mul(this.minutes(60));
    },
    days: function (val: number) {
        return BN.from(val).mul(this.hours(24));
    },
    weeks: function (val: number) {
        return BN.from(val).mul(this.days(7));
    },
    years: function (val: number) {
        return BN.from(val).mul(this.days(365));
    },
};
