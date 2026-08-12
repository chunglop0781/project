const { Tour } = require('../../models/tour.model');

module.exports.home = async (req, res) => {
    try {
        const tourList = await Tour.find().limit(6);

        res.render("client/pages/home", {
            pageTitle: "Trang chủ",
            tourList: tourList
        });
    } catch (error) {
        console.error("===== LOI LAY TOUR =====");
        console.error(error);
        console.error("========================");

        res.status(500).send(error.message);
    }
};