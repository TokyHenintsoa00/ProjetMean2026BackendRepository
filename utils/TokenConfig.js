const jwt = require('jsonwebtoken');

//generateToken avec remember me
// role_name : valeur de nom_role depuis la collection RoleUser (ex: 'admin', 'manager', 'client')
const generateToken = (user, expiresIn, id_boutique_user, role_name) => {
  try {
    const payload = {
      id: user._id,
      email: user.email,
      role: user.role,
      role_name: role_name || null,
      nom_client: user.nom_client,
      prenom_client: user.prenom_client,
    };

    if (id_boutique_user) {
      payload.id_boutique_user = id_boutique_user;
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
    console.log("Token payload:", jwt.decode(token));
    return token;
  } catch (error) {
    return null;
  }
}


const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = { generateToken, verifyToken };