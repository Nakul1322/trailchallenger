const express = require('express');
const router = express.Router();
const postController = require('../../controllers/cms')

router.get('/privacy-policy',
    postController.privacyPolicy);

router.get('/terms-condition',
    postController.termsAndConditions);

router.get('/about-us',
    postController.aboutUs);

router.get('/disclaimer',
    postController.disclaimer);

router.put('/updatePrivacyPolicy',
    postController.postPrivacyPolicy);

router.put('/updateTermsCondition',
    postController.postTermsAndConditions);

router.put('/updateAboutUs',
    postController.postAboutUs);

router.put('/updateDisclaimer',
    postController.postDisclaimer);

router.get('/updatePrivacyPolicy',
    postController.getPrivacyPolicy);

router.get('/updateTermsCondition',
    postController.getTermsAndConditions);

router.get('/updateAboutUs',
    postController.getAboutUs);

router.get('/updateDisclaimer',
    postController.getDisclaimer);

module.exports = router 