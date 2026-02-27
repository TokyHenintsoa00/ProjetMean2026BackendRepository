const jwt = require('jsonwebtoken');

//generateToken avec remember me
const generateToken = (user,expiresIn,id_boutique_user)=>{
  try 
  {

    if (id_boutique_user == null) 
    {
      return jwt.sign(
        {  id: user._id,
          email: user.email,
          role: user.role,
          nom_client:user.nom_client,
          prenom_client:user.nom_client,
        }, 
        process.env.JWT_SECRET,
        { expiresIn}
      );   
      
    } else {
      
       return jwt.sign(
      {  id: user._id,
        email: user.email,
        role: user.role,
        nom_client:user.nom_client,
        prenom_client:user.nom_client,
        id_boutique_user:id_boutique_user
      }, 
      process.env.JWT_SECRET,
      { expiresIn}
    );   
    }

    
  } catch (error) {
    
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