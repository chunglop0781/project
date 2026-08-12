const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
    name: String,
    vehicle: String
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = {
    Tour
};