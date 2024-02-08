//I HAVE NOT IMPLEMENTED THIS MIDDLEWARE (but made the response middleware as mentioned in code review)
exports.sendError = (error, res, code) => {
    console.log("exports.sendError -> error", error)
    let response = {
        "success": false,
        "status": error.status,
        "message": error.message,
        "data": {
            error: error.error
        }
    }
    res.status(code).json(response);
}

exports.sendSuccess = (data, res, code) => {
    let response = {
        "success": true,
        "status": data.status,
        "message": data.message,
        "data": data,
    }
    res.status(code).json(response);
}
