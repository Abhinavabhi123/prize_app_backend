const schedule = require("node-schedule");
const Cards = require("../models/cardModel");

async function scheduleLuckyDrawStart() {
  try {
    const activeCards = await Cards.find({
      isDelete: false,
      status: true,
      completed:false,
      isEliminationStarted: false,
      isStarted: false, 
    });

    activeCards.forEach((card) => {
      const startDate = new Date(card.startDate);

      if (startDate > new Date()) {
        schedule.scheduleJob(startDate, async function () {
          console.log(`Lucky Draw Started for Card: ${card.name} at ${startDate}`);
          await Cards.findByIdAndUpdate(card._id, { isStarted: true });
        });
      }
    });
  } catch (error) {
    console.error("Error scheduling lucky draw:", error);
  }
}

module.exports = scheduleLuckyDrawStart;
