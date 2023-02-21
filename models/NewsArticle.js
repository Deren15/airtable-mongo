const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const newsArticleSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    banner_image: {
        type: String,
        required: true,
    },
    article: {
        type: String,
        required: true,
    },
    categories: {
        type: Array,
    },
    summary: {
        type: String,
    }
}, {timestamps: true});

const NewsArticle = mongoose.model('NewsArticle', newsArticleSchema);
module.exports = NewsArticle