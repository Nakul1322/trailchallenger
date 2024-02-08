const HttpStatus = require('http-status');

const userExistsError = { message: 'User already exists', status: 409, success: false }

const emailNotExist = { message: 'Email is not registered with us', status: 204, success: false };

const linkExpiredError = { message: 'The Link is Expired', status: HttpStatus.BAD_REQUEST, success: false };

const noAccessRights = { message: 'You have No Access Rights', status: HttpStatus.BAD_REQUEST, success: false };

const tokenUbsentError = { message: 'Token is not present in the header', status: HttpStatus.BAD_REQUEST, success: false };

const unAuthorizedUserError = { message: 'Unauthorized User', status: HttpStatus.NOT_ACCEPTABLE, success: false };

const wrongPasswordError = { message: 'The password you have entered is incorrect', status: 401, success: false };

const wrongCredentialsError = { message: "You've entered wrong credentials", status: 401, success: false };

const otpExpiredOrWrongError = { message: 'OTP expired', status: 410, success: false };

const emailDuplicationError = { message: 'This email already exists', status: 401, success: false };

const userNotFoundError = { message: 'The user is not found', status: 400, success: false };

const userDeactivatedError = { message: 'The user is being deactivated by the admin', status: HttpStatus.PAYMENT_REQUIRED, success: false };

const userDeletedError = { message: 'The user is being deleted by the admin', status: 402, success: false };

const userBlockedError = { message: 'The user is being blocked by the admin', status: 402, success: false };

const internalError = { message: 'Internal Error', status: 500, success: false };

const productNotFoundError = { message: 'Product not found', status: 404, success: false };

const productExistError = { message: 'The product already exists', status: 401, success: false };

const challengeNotFoundError = { message: 'Challenge not found', status: 401, success: false };

const challengeTitleDuplicateError = { message: 'The challenge with similar title exists', status: 401, success: false };

const challengeExistError = { message: 'The challenge already exist', status: 401, success: false };

const challengeInProgressError = { message: 'The challenge is already in progress', status: 401, success: false };

const emailExistError = { message: 'The email already exist', status: 401, success: false };

const tokenNotFoundError = { message: 'Token not found', status: HttpStatus.BAD_REQUEST, success: false };

const videoNotFoundError = { message: 'Video not found', status: 401, success: false };

const userNotRegisteredError = { message: 'The user is not registered with us', status: 401, success: false };

const emailNotVerifiedError = { message: 'Your email is not verified', status: 403, success: false };

const emailSentError = { message: 'Error occurred while sending an email', status: 200, success: false };

const tokenExpiredError = { message: 'Token Expired', status: 404, success: false };

const cmsNotFoundError = { message: 'No CMS cms found', status: 401, success: false };

const productTitleDuplicateError = { message: 'Duplicate Product not allowed', status: 401, success: false };

const activityNotFoundError = { message: 'Activity not found', status: 401, success: false };

const activityTypeNotFoundError = { message: 'Activity type not found', status: 401, success: false };

const categoryNotFoundError = { message: 'Category not found', status: 401, success: false };

const countryNotFoundError = { message: 'Country not found', status: 401, success: false };

const categoryTitleDuplicateError = { message: 'The category of similar title exist', status: 401, success: false };

const countryTitleDuplicateError = { message: 'The country of similar title exist', status: 401, success: false };

const invalidLinkError = { message: 'Invalid Link', status: 401, success: false };

const userNotVerifiedError = { message: 'Please verify your email', status: 403, success: false };

const passwordMatchError = { message: 'Current and existing password are same', status: 401, success: false };

const passwordNotMatchError = { message: 'Existing password does not matched', status: 401, success: false };

const videoExistError = { message: 'Video already exists', status: 401, success: false };

const activityTypeExistError = { message: 'This activity already exists ', status: 401, success: false };

const challengeCategoryExistsError = { message: 'Category is already present in existing challenge ', status: 401, success: false };

const userPendingError = { message: 'Please verify your email ', status: 403, success: false };

const productCategoryExists = { message: 'Category is already present in some existing product ', status: 401, success: false };

const activityTimeExistsError = { message: "Activity time is merging with the existing time", status: 401, success: false };

const communityNotFoundError = { message: "Community post not found", status: 401, success: false };

const redeemcodeNotFoundError = { message: "Redeem code not found", status: 401, success: false };

const couponcodeNotFoundError = { message: "Coupon code is not valid", status: 401, success: false };

const cartNotFoundError = { message: "Cart is Empty", status: 401, success: false };

const notificationNotFoundError = { message: "Notification not found", status: 401, success: false };

const commentNotFoundError = { message: "Comment not found", status: 401, success: false };

const cartEmptyError = { message: "Cart is Empty", status: 401, success: false };

const productCategoryExistsError = { message: "Category already exists in a product", status: 401, success: false };

const postAlreadyReported = { message: "This post is already being reported by the user", status: 401, success: false };

const sponsoredNotFoundError = { message: "Sponsored link already exists", status: 401, success: false };

const couponcodeExistError = { message: "Coupon code already exists", status: 401, success: false };

const reportNotFoundError = { message: "No report found", status: 401, success: false };

const coordinatesMoreThanLimit = { message: "Receiving more than 25 coordinates in the route", status: 401, success: false };

const noAnnouncementFound = { message: "No available announcement for the current date", status: 401, success: false };

const pinTitleDuplicateError = { message: 'The pin with similar title exist', status: 401, success: false };

module.exports = {
    emailDuplicationError,
    internalError,
    noAccessRights,
    tokenUbsentError,
    unAuthorizedUserError,
    otpExpiredOrWrongError,
    linkExpiredError,
    wrongPasswordError,
    emailNotExist,
    userExistsError,
    userNotFoundError,
    userDeactivatedError,
    userBlockedError,
    userDeletedError,
    userNotVerifiedError,
    wrongCredentialsError,
    productNotFoundError,
    productExistError,
    challengeNotFoundError,
    challengeTitleDuplicateError,
    countryNotFoundError,
    challengeExistError,
    challengeInProgressError,
    emailExistError,
    userPendingError,
    tokenNotFoundError,
    videoNotFoundError,
    videoExistError,
    userNotRegisteredError,
    emailNotVerifiedError,
    emailSentError,
    tokenExpiredError,
    cmsNotFoundError,
    productTitleDuplicateError,
    activityNotFoundError,
    activityTypeNotFoundError,
    activityTypeExistError,
    categoryNotFoundError,
    categoryTitleDuplicateError,
    countryTitleDuplicateError,
    challengeCategoryExistsError,
    invalidLinkError,
    passwordNotMatchError,
    passwordMatchError,
    productCategoryExists,
    activityTimeExistsError,
    communityNotFoundError,
    redeemcodeNotFoundError,
    couponcodeNotFoundError,
    couponcodeExistError,
    cartNotFoundError,
    notificationNotFoundError,
    commentNotFoundError,
    cartEmptyError,
    productCategoryExistsError,
    postAlreadyReported,
    reportNotFoundError,
    sponsoredNotFoundError,
    coordinatesMoreThanLimit,
    noAnnouncementFound,
    pinTitleDuplicateError
};
