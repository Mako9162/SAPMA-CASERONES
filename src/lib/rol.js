const roles = {
    Admin: 1,
    Plan: 2,
    Tec: 3,
    Cli_A: 4,
    Cli_B: 5,
    Cli_C: 6,
    Cli_D: 7,
    Cli_E: 8,
    Admincli: 9,
    GerVer: 10
};

function authRole(rolesArray) {
    return (req, res, next) => {
        if (rolesArray.some(role => roles[role] === req.user.Id_Perfil)) {
            next();
        } else {
            res.redirect('/');
        }
    };
}

module.exports = {
    authRole,   
    roles
};