const express = require('express');
const router = express.Router();
const { requestValidator, /*checkUserValidity*/ } = require('../../middleware');
const schema = require('./schema');
const userController = require('../../controllers/user')

router.get('/filterListPurchase',
    userController.filterListPurchase);

router.get('/filterListOptIn',
    userController.filterListOptIn);

router.get('/usersLocation',
    userController.allUserLocation);

router.get('/get-profile/:id',
    //checkUserValidity,
    requestValidator(schema.getById, 'params'),
    userController.getUserData);

router.get('/get-all-users',
    userController.getAllUsers);

router.get('/userListInNotification',
    userController.userListInNotification);

router.put('/update-profile/:id',
    //checkUserValidity,
    requestValidator(schema.getById, 'params'),
    requestValidator(schema.update),
    userController.updateUserData);

router.put('/block/:id',
    requestValidator(schema.getById, 'params'),
    userController.blockUser);

router.delete('/:id',
    requestValidator(schema.getById, 'params'),
    userController.removeUser);

router.put('/update-admin-password/:id',
    requestValidator(schema.getById, 'params'),
    requestValidator(schema.changeAdminPassword),
    userController.changeAdminProfile);

router.post('/add-user',
    requestValidator(schema.addUser),
    userController.addUser);

router.put('/change-password/:id',
    //checkUserValidity,
    requestValidator(schema.getById, 'params'),
    requestValidator(schema.changePassword),
    userController.changePassword);

router.post('/userDetails',
    requestValidator(schema.userDetails),
    userController.userDetails);

router.get('/physicalPurchaseList/:id',
    userController.userPhysicalPurchaseList);

router.get('/digitalPurchaseList/:id',
    userController.userDigitalPurchaseList);

router.put('/updateDigitalStatus',
    userController.updateDigitalPurchase);

router.put('/updatePhysicalStatus/:id',
    userController.updatePhysicalPurchase);




module.exports = router

