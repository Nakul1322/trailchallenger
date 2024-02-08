const express = require('express');
const router = express.Router();
const { requestValidator, checkUserValidity } = require('../../middleware');
const { verifyAccessToken } = require('../../helpers/jwt_helper');
const schema = require('./schema');
const challengeController = require('../../controllers/challenge')

router.put('/editLog',
    verifyAccessToken,
    //checkUserValidity,
    challengeController.editLogData);

router.put('/updateRanking',
    verifyAccessToken,
    //checkUserValidity,
    challengeController.updateRanking);

router.delete('/deleteRanking/:id',
    requestValidator(schema.getById, 'params'),
    //verifyAccessToken,
    challengeController.deleteRanking);   

router.get('/viewAllOnMaps',
    //verifyAccessToken,
    challengeController.viewAllOnMaps);

router.post('/log',
    //verifyAccessToken,s
    challengeController.logList);

router.get('/get-all-challenges',
    //verifyAccessToken,
    challengeController.getAllChallenge);

router.post('/allChallenges',
    challengeController.getAllChallengeUserSide);

router.get('/subChallengeList',
    challengeController.subChallengeList);

router.get('/liveChallengeList',
    challengeController.liveChallengeList);

router.post('/',
    //verifyAccessToken,
    // requestValidator(schema.addChallenge),
    challengeController.addChallenge);

router.get('/:id',
    //verifyAccessToken,
    requestValidator(schema.getById, 'params'),
    challengeController.findGetChallenge);


router.post('/findChallenge',
    //verifyAccessToken,
    challengeController.findChallenge);

router.put('/:id',
    //verifyAccessToken,
    requestValidator(schema.getById, 'params'),
    // requestValidator(schema.updateChallenge),
    challengeController.updateChallenge);

router.delete('/:id',
    //verifyAccessToken,
    requestValidator(schema.getById, 'params'),
    challengeController.deleteChallenge);

router.get('/user-challenge-list/:id',
    //verifyAccessToken,
    //checkUserValidity,
    requestValidator(schema.getById, 'params'),
    challengeController.userChallengeList);

router.post('/updateUserChallengeList',
    //verifyAccessToken,
    //checkUserValidity,
    challengeController.updateUserChallengeList);

router.post('/leaderBoard',
    verifyAccessToken,
    //checkUserValidity,
    challengeController.leaderBoard);

router.post('/myHikes',
    verifyAccessToken,
    //checkUserValidity,
    // requestValidator(schema.addChallenge),
    challengeController.addHike);

router.post('/addHikes',
    verifyAccessToken,
    //checkUserValidity,
    // requestValidator(schema.addChallenge),
    challengeController.addHikeFromAdmin);

router.put('/updateHike/:id',
    verifyAccessToken,
    //checkUserValidity,
    // requestValidator(schema.updateChallenge),
    challengeController.updateHike);

router.put('/updateIsSponsored/:id',
    verifyAccessToken,
    //checkUserValidity,
    requestValidator(schema.getById, 'params'),
    challengeController.updateIsSponsored);

router.delete('/deleteHike/:id',
    verifyAccessToken,
    //checkUserValidity,
    requestValidator(schema.getById, 'params'),
    challengeController.deleteHike);

router.post('/logoutDeletion',
    verifyAccessToken,
    //checkUserValidity,
    challengeController.deleteHikeAfterLogout);

router.get('/findHike/:id',
    verifyAccessToken,
    //checkUserValidity,
    requestValidator(schema.getById, 'params'),
    challengeController.findHike);

router.post('/hikeList',
    verifyAccessToken,
    //checkUserValidity,
    challengeController.hikeList);

router.put('/updateLog/:trailId/:userId/:hikeId',
    verifyAccessToken,
    //checkUserValidity,
    challengeController.updateLogData);

router.get('/getLog/:trailId/:userId/:hikeId',
    verifyAccessToken,
    //checkUserValidity,
    challengeController.getLogData);

router.get('/popup/:trailId/:userId',
    verifyAccessToken,
    //checkUserValidity,
    challengeController.challengeCompletionPopupScreen);

router.post('/updateLogViaCoordinates',
    challengeController.updateLogBasedOnCoordinates)

router.get('/leaderBoardList/:trailId',
    verifyAccessToken,
    challengeController.leaderBoardList);
    
module.exports = router