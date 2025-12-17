const error={
    INTERNAL_SERVER:{
        status_code:500,
        success:false,
        message:"Internal Server error"
    },
    BAD_REQUEST:{
        status_code:400,
        success:false,
        message:"Bad Request"
    },
    UNAUTHORISED:{
        status_code:401,
        success:false,
        message:"Unauthorised"
    },
    FORBIDDEN:{
        status_code:403,
        success:false,
        message:"Forbidden"
    },
    NOT_FOUND:{
        status_code:404,
        success:false,
        message:"Resource not found"
    },
    USER_ALREADY_EXISTS:{
        status_code:409,
        success:false,
        message:"User already exists"
    },
    INVALID_CREDENTIALS:{
        status_code:401,
        success:false,
        message:"Invalid Credentials"
    },
}

module.exports=error;