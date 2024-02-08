const express = require('express');
const router = express.Router();
const { requestValidator, checkUserValidity } = require('../../middleware');
const { verifyAccessToken } = require('../../helpers/jwt_helper')
const schema = require('./schema');
const communityController = require('../../controllers/community');
const { Router } = require('express');

router.get('/allComments',
    //checkUserValidity,
    communityController.commentList);

router.get('/listReportedPost',
    //verifyAccessToken,
    communityController.listReportedPost);

router.delete('/deleteReport/:id',
    //verifyAccessToken,
    requestValidator(schema.getById, 'params'),
    communityController.deleteReport);

router.post('/',
    checkUserValidity,
    //verifyAccessToken,
    requestValidator(schema.addCommunity),
    communityController.addCommunity);

router.post('/get-all-community',
    //checkUserValidity,
    communityController.getAllCommunity);

router.post('/findCommunity',
    checkUserValidity,
    //verifyAccessToken,
    // requestValidator(schema.getById, 'params'),
    communityController.findCommunity);

router.delete('/:id',
    checkUserValidity,
    //verifyAccessToken,
    requestValidator(schema.getById, 'params'),
    communityController.deleteCommunity);

router.put('/:id',
    checkUserValidity,
    //verifyAccessToken,
    requestValidator(schema.getById, 'params'),
    requestValidator(schema.updateCommunity),
    communityController.updateCommunity);

router.post('/reportPost',
    checkUserValidity,
    //verifyAccessToken,
    communityController.reportPost);

router.post('/reportedUser',
    checkUserValidity,
    //verifyAccessToken,
    communityController.reportedUser)

router.post('/likePost',
    checkUserValidity,
    //verifyAccessToken,
    communityController.likePost);

router.get('/allLikes/:id',
    checkUserValidity,
    communityController.allLikePost);

router.post('/addComment',
    checkUserValidity,
    //verifyAccessToken,
    communityController.addComment);

router.delete('/deleteComment/:id',
    checkUserValidity,
    //verifyAccessToken,
    requestValidator(schema.getById, 'params'),
    communityController.deleteComment);

router.put('/updateComment/:id',
    checkUserValidity,
    //verifyAccessToken,
    requestValidator(schema.getById, 'params'),
    communityController.updateComment);

router.get('/findComment/:id',
    //checkUserValidity,
    requestValidator(schema.getById, 'params'),
    communityController.findComment);

module.exports = router