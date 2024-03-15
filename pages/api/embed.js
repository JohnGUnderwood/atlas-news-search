import { createRouter } from 'next-connect';
import selectModel from '../../middleware/selectModel';

const router = createRouter();
selectModel(router);

router.get(async (req, res) => {
    if(!req.query.terms){
        console.log(`Request missing required parameters: terms`)
        res.status(400).send(`Request missing required parameters: terms`);
    }else{
        const string = req.query.terms
        try{
            const response = await req.model.embed(string);
            res.status(200).json(response);
        }catch(error){
            res.status(405).json(error);
        }
    }
});

export default router.handler();
export { router as embedRouter };