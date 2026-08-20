exports.notFound = (req, res) => {
    res.status(404).render('errors/404', {
        pageTitle: '404 - Không tìm thấy trang'
    });
};