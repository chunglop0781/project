const Tour = require('../../models/tour.model');

module.exports.list = async (req, res) => {
    try {
        const tourList = await Tour.find();

        console.log("Danh sách tour:", tourList);

        res.render("client/pages/tour-list", {
            pageTitle: "Danh sách tour",
            tourList: tourList
        });
    } catch (error) {
        console.error("===== LOI LAY TOUR =====");
        console.error(error);
        console.error("========================");

        res.status(500).send(error.message);
    }
};



module.exports.detail = async (req, res) => {
    try {
        const tourList = await Tour.find();

        console.log("Danh sách tour:", tourList);

        res.render("client/pages/tour-detail", {
            pageTitle: "Chi tiết tour",
            tourList: tourList
        });
    } catch (error) {
        console.error("===== LOI LAY TOUR =====");
        console.error(error);
        console.error("========================");

        res.status(500).send(error.message);
    }
};
