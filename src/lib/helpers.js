// const bcrypt = require('bcryptjs');
const md5 = require('md5');
const helpers = {};

helpers.encryptPassword = async (Clave) => {
    // const salt = await bcrypt.genSalt(10);
    const hash = await md5(Clave);
    return hash;
};

helpers.matchClave = async (Clave, savedClave) => {
    try {
        return await md5(Clave) === savedClave;
    } catch (e) {
        console.log(e);
    }
};



module.exports = helpers;