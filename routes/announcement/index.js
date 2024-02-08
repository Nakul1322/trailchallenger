const express = require('express');
const { requestValidator, checkUserValidity } = require('../../middleware');
const schema = require('./schema');
const router = express.Router();
const announcementController = require('../../controllers/announcement')

router.post('/',
    requestValidator(schema.addAnnouncement),
    announcementController.addAnnouncement);

router.put('/updateAnnouncement/:id',
    announcementController.updateAnnouncement); //);

router.delete('/deleteAnnouncement/"id',
    announcementController.deleteAnnouncement); //); //);

router.get('/announcementList',
    announcementController.getAllAnnouncement);

router.get('/validateAnnouncement',
    announcementController.validateAnnouncement);



//********************************ANNOUNCEMENT BUTTON LIST APIS************************************************ */
router.post('/addAnnouncementButton',
    requestValidator(schema.addAnnouncementButton),
    announcementController.addAnnouncementButton);

router.put('/updateAnnouncementButtonList/:id',
    announcementController.updateAnnouncementButton); //);

router.delete('/deleteAnnouncementButtonList/"id',
    announcementController.deleteAnnouncementButton); //); //);

router.get('/announcementButtonList',
    announcementController.getAllAnnouncementButton);

module.exports = router 