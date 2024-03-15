import { createRouter } from 'next-connect';
import database from '../../../middleware/database';
import { schema } from '../../../config.mjs'

async function getResults(collection,pipeline){
    try{
        const results = await collection.aggregate(pipeline).toArray();
        return results;
    }catch(error){
        throw error
    }
}

const router = createRouter();

router.use(database);

router.post(async (req, res) => {
    if(!req.query.q){
        console.log(`Request missing 'q' param`)
        res.status(400).send(`Request missing 'q' param`);
    }else{
        const textOp = {
            text:{
                  query:req.query.q,
                  path: [
                    { "wildcard": `${schema.titleField}.*` },
                    { "wildcard": `${schema.descriptionField}.*` },
                    { "wildcard": `${schema.contentField}.*` }
                  ]
              }
        }

        var searchOpts = {
            index:"searchIndex",
            compound:{
                must:[textOp],
                filter:[]
            },
            highlight:{
                path:[
                    {wildcard:`${schema.descriptionField}.*`},
                    {wildcard:`${schema.contentField}.*`}
                ]
            },
            sort:{
                unused:{"$meta":"searchScore"},
                published:-1
            }
        }
      
        if(req.body.page == 'next' && req.body.pageToken){
          searchOpts.searchAfter = req.body.pageToken
        }else if(req.body.page == 'prev' && req.body.pageToken){
          searchOpts.searchBefore = req.body.pageToken
        }

        if(req.body.filters && Object.keys(req.body.filters).length > 0){
            for (const [field, filter] of Object.entries(req.body.filters)){

                if(filter.type == "equals"){
                    const opt = {
                        equals: {
                            path: field,
                            value: filter.val
                        }
                    }
                    searchOpts.compound.filter.push(opt);
                }
            }
        }
        const pipeline = [
            {
                $search:searchOpts
            },
            {
                $limit: req.query.pageSize ? req.query.pageSize : 4
            },
            {
                $project:{
                  title:`$${schema.titleField}`,
                  image:`$${schema.imageField}`,
                  description:`$${schema.descriptionField}`,
                  highlights: { $meta: "searchHighlights" },
                  score:{$meta:"searchScore"},
                  paginationToken: {$meta: 'searchSequenceToken'},
                  lang:1,
                  attribution:1
                }
            }
        ]

        try{
            const response = await getResults(req.collection,pipeline);
            if(req.query.page == 'prev' && req.query.pageToken){
                res.status(200).json({results:response.reverse(),query:pipeline});
            }else{
                res.status(200).json({results:response,query:pipeline});
            }
        }catch(error){
            res.status(405).json({'error':`${error}`,query:pipeline});
        }
    }
});

export default router.handler();