const mongoose = require('mongoose');
const shortid = require('shortid');
const passwordLib = require('./../libs/generatePasswordLib');
const response = require('./../libs/responseLib')
const logger = require('./../libs/loggerLib');
const validateInput = require('../libs/paramsValidationLib')
const check = require('../libs/checkLib')
const time = require('./../libs/timeLib');
const token = require('../libs/tokenLib')
const uuid = require('uuid')
const AuthModel = mongoose.model('Auth')

/* Models */
const UserModel = mongoose.model('User')
// start user signup function 

let signUpFunction = (req, res) => {

    let validateUserInput = () => {
        return new Promise((resolve, reject) => {
            if (req.body.email) {
                if (!validateInput.Email(req.body.email)) {
                    let apiResponse = response.generate(true, 'Email Does not met the requirement', 400, null)
                    reject(apiResponse)
                } else if (check.isEmpty(req.body.password)) {
                    let apiResponse = response.generate(true, '"password" parameter is missing"', 400, null)
                    reject(apiResponse)
                } else {
                    resolve(req)
                }
            } else {
                logger.error('Field Missing During User Creation', 'userController: createUser()', 5)
                let apiResponse = response.generate(true, 'One or More Parameter(s) is missing', 400, null)
                reject(apiResponse)
            }
        })
    }// end validate user input
    let createUser = () => {
        return new Promise((resolve, reject) => {
            UserModel.findOne({ email: req.body.email })
                .exec((err, retrievedUserDetails) => {
                    if (err) {
                        logger.error(err.message, 'userController: createUser', 10)
                        let apiResponse = response.generate(true, 'Failed To Create User', 500, null)
                        reject(apiResponse)
                    } else if (check.isEmpty(retrievedUserDetails)) {
                        console.log(req.body)
                        let newUser = new UserModel({
                            userId: shortid.generate(),
                            name: req.body.name, 
                            email: req.body.email.toLowerCase(),
                            password: passwordLib.hashpassword(req.body.password),
                            
                        })
                        newUser.save((err, newUser) => {
                            if (err) {
                                console.log(err)
                                logger.error(err.message, 'userController: createUser', 10)
                                let apiResponse = response.generate(true, 'Failed to create new User', 500, null)
                                reject(apiResponse)
                            } else {
                                let newUserObj = newUser.toObject();
                                resolve(newUserObj)
                            }
                        })
                    } else {
                        logger.error('User Cannot Be Created.User Already Present', 'userController: createUser', 4)
                        let apiResponse = response.generate(true, 'User Already Present With this Email', 403, null)
                        reject(apiResponse)
                    }
                })
        })
    }// end create user function


    validateUserInput(req, res)
        .then(createUser)
        .then((resolve) => {
            delete resolve.password
            let apiResponse = response.generate(false, 'User created', 200, resolve)
            res.send(apiResponse)
        })
        .catch((err) => {
            console.log(err);
            res.send(err);
        })

}// end user signup function 

// start of login function 
let loginFunction = (req, res) => {
    let findUser = () => {
        console.log("findUser");
        return new Promise((resolve, reject) => {
            if (req.body.email) {
                console.log("req body email is there");
                console.log(req.body);
                UserModel.findOne({ email: req.body.email}, (err, userDetails) => {
                    /* handle the error here if the User is not found */
                    if (err) {
                        console.log(err)
                        logger.error('Failed To Retrieve User Data', 'userController: findUser()', 10)
                        /* generate the error message and the api response message here */
                        let apiResponse = response.generate(true, 'Failed To Find User Details', 500, null)
                        reject(apiResponse)
                        /* if Company Details is not found */
                    } else if (check.isEmpty(userDetails)) {
                        /* generate the response and the console error message here */
                        logger.error('No User Found', 'userController: findUser()', 7)
                        let apiResponse = response.generate(true, 'No User Details Found', 404, null)
                        reject(apiResponse)
                    } else {
                        /* prepare the message and the api response here */
                        logger.info('User Found', 'userController: findUser()', 10)
                        resolve(userDetails)
                    }
                });
               
            } else {
                let apiResponse = response.generate(true, '"email" parameter is missing', 400, null)
                reject(apiResponse)
            }
        })
    }
    let validatePassword = (retrievedUserDetails) => {
        console.log("validatePassword");
        return new Promise((resolve, reject) => {
            passwordLib.comparePassword(req.body.password, retrievedUserDetails.password, (err, isMatch) => {
                if (err) {
                    console.log(err)
                    logger.error(err.message, 'userController: validatePassword()', 10)
                    let apiResponse = response.generate(true, 'Login Failed', 500, null)
                    reject(apiResponse)
                } else if (isMatch) {
                    let retrievedUserDetailsObj = retrievedUserDetails.toObject()
                    delete retrievedUserDetailsObj.password
                    delete retrievedUserDetailsObj._id
                    delete retrievedUserDetailsObj.__v
                    resolve(retrievedUserDetailsObj)
                } else {
                    logger.info('Login Failed Due To Invalid Password', 'userController: validatePassword()', 10)
                    let apiResponse = response.generate(true, 'Wrong Password.Login Failed', 400, null)
                    reject(apiResponse)
                }
            })
        })
    }

    let generateToken = (userDetails) => {
        console.log("generate token");
        return new Promise((resolve, reject) => {
            token.generateToken(userDetails, (err, tokenDetails) => {
                if (err) {
                    console.log(err)
                    let apiResponse = response.generate(true, 'Failed To Generate Token', 500, null)
                    reject(apiResponse)
                } else {
                    tokenDetails.userId = userDetails.userId
                    tokenDetails.userDetails = userDetails
                    resolve(tokenDetails)
                }
            })
        })
    }
    let saveToken = (tokenDetails) => {
        console.log("save token");
        return new Promise((resolve, reject) => {
            AuthModel.findOne({ userId: tokenDetails.userId }, (err, retrievedTokenDetails) => {
                if (err) {
                    console.log(err.message, 'userController: saveToken', 10)
                    let apiResponse = response.generate(true, 'Failed To Generate Token', 500, null)
                    reject(apiResponse)
                } else if (check.isEmpty(retrievedTokenDetails)) {
                    let newAuthToken = new AuthModel({
                        userId: tokenDetails.userId,
                        authToken: tokenDetails.token,
                        tokenSecret: tokenDetails.tokenSecret,
                        tokenGenerationTime: time.now()
                    })
                    newAuthToken.save((err, newTokenDetails) => {
                        if (err) {
                            console.log(err)
                            logger.error(err.message, 'userController: saveToken', 10)
                            let apiResponse = response.generate(true, 'Failed To Generate Token', 500, null)
                            reject(apiResponse)
                        } else {
                            let responseBody = {
                                authToken: newTokenDetails.authToken,
                                userDetails: tokenDetails.userDetails
                            }
                            resolve(responseBody)
                        }
                    })
                } else {
                    retrievedTokenDetails.authToken = tokenDetails.token
                    retrievedTokenDetails.tokenSecret = tokenDetails.tokenSecret
                    retrievedTokenDetails.tokenGenerationTime = time.now()
                    retrievedTokenDetails.save((err, newTokenDetails) => {
                        if (err) {
                            console.log(err)
                            logger.error(err.message, 'userController: saveToken', 10)
                            let apiResponse = response.generate(true, 'Failed To Generate Token', 500, null)
                            reject(apiResponse)
                        } else {
                            let responseBody = {
                                authToken: newTokenDetails.authToken,
                                userDetails: tokenDetails.userDetails
                            }
                            resolve(responseBody)
                        }
                    })
                }
            })
        })
    }

    findUser(req,res)
        .then(validatePassword)
        .then(generateToken)
        .then(saveToken)
        .then((resolve) => {
            let apiResponse = response.generate(false, 'Login Successful', 200, resolve)
            res.status(200)
            res.send(apiResponse)
        })
        .catch((err) => {
            console.log("errorhandler");
            console.log(err);
            res.status(err.status)
            res.send(err)
        })
}



// end of the login function 

//forgot password

let forgotPassword = (req,res) => {
    let validateEmail = () =>{
        return new Promise((resolve,reject)=>{
            UserModel.findOne({ email: req.body.email.toLowerCase()},(err,result)=>{
                if(err){
                    logger.error(err.message,'User Controller : validateEmail',10)
                    let apiResponse = response.generate(true,`error occured : ${err.message}`,500,null)
                    reject(apiResponse)
                } else if (check.isEmpty(result)){
                    let apiResponse = response.generate(true,'No User Found',400,null)
                    reject(apiResponse)
                } else {
                    resolve()
                }
            })
        })
        
    }
    let updateResetTokenInUser = ()=>{
        return new Promise((resolve, reject) => {
            let findQuery = {
                email: req.body.email
            }
            let updateQuery = {
              resetPasswordToken: uuid.v4(),
              resetPasswordExpires : Date.now() + 300000 //link expiration after 5 mins
            }
            console.log(uuid.v4())
            UserModel.findOneAndUpdate(findQuery, updateQuery, {multi: true,new:true})
            .exec((err, result) => {
              if (err) {
                console.log(err)
                logger.error(err.message, 'User Controller: updateResetTokenInUser', 10)
                let apiResponse = response.generate(true, `Reset Token Failed`, 500, null)
                reject(apiResponse)
              } else {
                  let resultObj = result.toObject()
                  delete resultObj._id
                  delete resultObj.__v
                resolve(resultObj)
              }
            })
          })
        }
    validateEmail(req,res)
    .then(updateResetTokenInUser)
    .then((resolve)=>{
        let apiResponse = response.generate(false,'Reset Token successful',200,resolve)
        res.send(apiResponse)
    })
    .catch((err)=>{
        res.send(err)
    })
}

let resetPassword = (req,res) => {
    let findUser = () =>{
        return new Promise((resolve,reject)=>{
            UserModel.findOne({ resetPasswordToken: req.body.resetPasswordToken, resetPasswordExpires : { $gt: new Date(Date.now())}},(err,result)=>{
                if(err){
                    logger.error(err.message,'User Controller : findUser',10)
                    let apiResponse = response.generate(true,`error occured : ${err.message}`,500,null)
                    reject(apiResponse)
                } else if (check.isEmpty(result)){
                    let apiResponse = response.generate(true,'Link Expired',400,null)
                    reject(apiResponse)
                } else {
                    resolve()
                }
            })
        })
        
    }

    let updatePassword = () =>{
        return new Promise((resolve,reject)=>{
            let updateQuery = {
                password : passwordLib.hashpassword(req.body.password),
                $unset : { resetPasswordToken:1,resetPasswordExpires:1 }
              }
            UserModel.update({ resetPasswordToken: req.body.resetPasswordToken},updateQuery ,(err,result)=>{
                if(err){
                    logger.error(err.message,'User Controller : resetPassword',10)
                    let apiResponse = response.generate(true,`Password update failed`,500,null)
                    reject(apiResponse)
                } else if(!validateInput.Password(req.body.password)){
                    let apiResponse = response.generate(true,`Password must be atleast 8 characters`,400,null)
                    reject(apiResponse)
                } 
                else if (check.isEmpty(result)){
                    let apiResponse = response.generate(true,'No User Found',400,null)
                    reject(apiResponse)
                } else {
                    resolve(result)
                }
            })
        })
        
    }
    findUser(req,res)
    .then(updatePassword)
    .then((resolve)=>{
        let apiResponse = response.generate(false,'Password Successfully Updated',200,resolve)
        res.send(apiResponse)
    })
    .catch((err)=>{
        res.send(err)
    })
}
module.exports = {

    signUpFunction: signUpFunction,
    loginFunction: loginFunction,
    forgotPassword : forgotPassword,
    resetPassword : resetPassword,

}