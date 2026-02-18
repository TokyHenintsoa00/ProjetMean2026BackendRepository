const authMiddleware  = require('../Middleware/verifyToken')
const router = express.Router();

router.post('',authMiddleware,async function(req,res){
    
})