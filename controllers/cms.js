const { Staticcontents } = require('../models/staticContents');
const { Types } = require('mongoose');
const HttpStatus = require('http-status');

const errors = require('../errors');

//ADD CMS 
const privacyPolicy = async function (req, res) {
    try {
        let details = await Staticcontents.findOne({ variable: 'privacyPolicy', status: 1 });
        console.log(details)
        res.render('cms', { title: process.env.PROJECT_NAME + ' | ' + details.page_title, html_data: details });
    } catch (error) {
        res.render('404', { title: process.env.PROJECT_NAME, html_data: { description: "Page Not found" } });
    }
};

const getPrivacyPolicy = async function (req, res) {
    let details;
    try {
        details = await Staticcontents.findOne({ variable: 'privacyPolicy', status: 1 }).select({description:1}).exec();;
    } catch (error) {
        return next(error);
    }
    return res.status(HttpStatus.OK).json({ message: 'Privacy Policy', data: details, status: 200, success: true });
};

const postPrivacyPolicy = async function (req, res, next) {
    const { description } = req.body
    let details;
    try {
        details = await Staticcontents.findOneAndUpdate({ variable: 'privacyPolicy' }, { $set: { description: description } }, { new: true }).select('-__v').exec();
        console.log(details)
        return res.send({ message: "Privacy Policy updated successfully", data: details, status: 200, success: true })
    }
    catch (err) {
        return next(err);
    }
};

const termsAndConditions = async function (req, res) {
    try {
        let details = await Staticcontents.findOne({ variable: 'termsCondition', status: 1 });
        res.render('cms', { title: process.env.PROJECT_NAME + ' | ' + details.page_title, html_data: details });
    } catch (error) {
        res.render('404', { title: process.env.PROJECT_NAME, html_data: { description: "Page Not found" } });
    }
};

const getTermsAndConditions = async function (req, res) {
    let details;
    try {
        details = await Staticcontents.findOne({ variable: 'termsCondition', status: 1 }).select({description:1}).exec();;
    } catch (error) {
        return next(error);
    }
    return res.status(HttpStatus.OK).json({ message: 'Terms and conditions', data: details, status: 200, success: true });
};

const postTermsAndConditions = async function (req, res, next) {
    const { description } = req.body
    try {
        let details = await Staticcontents.findOneAndUpdate({ variable: 'termsCondition' }, { $set: { description: description } }, { new: true })
        return res.send({ message: "Terms and conditions updated successfully", data: details, status: 200, success: true })
    } catch (error) {
        return error
    }
}

const aboutUs = async function (req, res) {
    try {
        let details = await Staticcontents.findOne({ variable: 'aboutUs', status: 1 });
        res.render('cms', { title: process.env.PROJECT_NAME + ' | ' + details.page_title, html_data: details });
    }
    catch (error) {
        res.render('404', { title: process.env.PROJECT_NAME, html_data: { description: "Page Not found" } });
    }
}

const getAboutUs = async function (req, res) {
    let details;
    try {
        details = await Staticcontents.findOne({ variable: 'aboutUs', status: 1 }).select({description:1}).exec();;
    } catch (error) {
        return next(error);
    }
    return res.status(HttpStatus.OK).json({ message: 'About Us', data: details, status: 200, success: true });
};

const postAboutUs = async function (req, res, next) {
    const { description } = req.body
    try {
        let details = await Staticcontents.findOneAndUpdate({ variable: 'aboutUs' }, { $set: { description: description } }, { new: true })
        return res.send({ message: "About us updated successfully", data: details, status: 200, success: true })
    } catch (error) {
        return error
    }
}

const disclaimer = async function (req, res) {
    try {
        let details = await Staticcontents.findOne({ variable: 'disclaimer', status: 1 });
        res.render('cms', { title: process.env.PROJECT_NAME + ' | ' + details.page_title, html_data: details });
    }
    catch (error) {
        res.render('404', { title: process.env.PROJECT_NAME, html_data: { description: "Page Not found" } });
    }
}

const getDisclaimer = async function (req, res) {
    let details;
    try {
        details = await Staticcontents.findOne({ variable: 'disclaimer', status: 1 }).select({description:1}).exec();
    } catch (error) {
        return next(error);
    }
    return res.status(HttpStatus.OK).json({ message: 'Disclaimer', data: details, status: 200, success: true });
};

const postDisclaimer = async function (req, res, next) {
    const { description } = req.body
    try {
        let details = await Staticcontents.findOneAndUpdate({ variable: 'disclaimer' }, { $set: { description: description } }, { new: true })
        return res.send({ message: "Disclaimer updated successfully", data: details, status: 200, success: true })
    } catch (error) {
        return error
    }
}

module.exports = {
    privacyPolicy,
    termsAndConditions,
    aboutUs,
    disclaimer,
    postPrivacyPolicy,
    postTermsAndConditions,
    postAboutUs,
    postDisclaimer,
    getPrivacyPolicy,
    getTermsAndConditions,
    getAboutUs,
    getDisclaimer
}