const schedule = require("node-schedule");
const Cards = require("../models/cardModel");
const Coupon = require("../models/couponModel");

async function schedulePickWinner() {
  try {
    const activeCards = await Cards.find({
      isDelete: false,
      status: true,
      isEliminationStarted: true,
      eliminationStages: {
        $not: { $elemMatch: { status: false } },
      },
    });

    activeCards.forEach((card) => {
      console.log("card for next winner picker", card);

      const pickerDate = new Date(card.endDate);
      if (pickerDate > new Date()) {
        schedule.scheduleJob(pickerDate, async function () {
          console.log(`Prize picking scheduled for ${card.name} , ${card._id}`);
          console.log(`Prize picking scheduled for date ${card.endDate}`);
          const remainingCoupons = await Coupon.find({
            couponCard: card._id,
            status: true,
          });
          if (remainingCoupons.length === 0) {
            console.log("⚠️ No active coupons left to pick a winner.");
            return;
          }
          const shuffledCoupons = [...remainingCoupons];
          for (let i = shuffledCoupons.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledCoupons[i], shuffledCoupons[j]] = [
              shuffledCoupons[j],
              shuffledCoupons[i],
            ];
          }
          const winnerCoupon = shuffledCoupons[0];
          if (!winnerCoupon) {
            console.log("⚠️ No coupon available for selection.");
            return;
          }
          // Update all non-winner coupons to `status: false`
          await Coupon.updateMany(
            { couponCard: card._id, _id: { $ne: winnerCoupon._id } }, // Exclude the winner
            { $set: { status: false } }
          ).then(async () => {
            await Cards.findByIdAndUpdate(card._id, {
              $set: { winnerCoupon: winnerCoupon._id, completed: true },
            });
          });
        });
      }
    });
  } catch (error) {
    console.error("Error scheduling winner picking:", error);
  }
}

module.exports = schedulePickWinner;
