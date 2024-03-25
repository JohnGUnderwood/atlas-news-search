import { createRouter } from 'next-connect';
import database from '../../../middleware/database';
import selectModel from '../../../middleware/selectModel';

async function getResults(collection,pipeline){
    try{
        const results = await collection.aggregate(pipeline).toArray();
        return results;
    }catch(error){
        throw error
    }
}

const router = createRouter();
selectModel(router);
router.use(database);

router.post(async (req, res) => {
    if(!req.query.q){
        console.log(`Request missing 'q' param`)
        res.status(400).send(`Request missing 'q' param`);
    }else{
        const embedding = await req.model.embed(req.query.q);

        const vectorOpts = {
            index:"vectorIndex",
            path:"embedding",
            queryVector: embedding,
            numCandidates:250,
            limit:50
        }

        var searchOpts = {
            index:"searchIndex",
            text:{
                query:req.query.q,
                path: [
                  "title",
                  "content"
                ]
            }
        }

        if(req.body.filters && Object.keys(req.body.filters).length > 0){
            searchOpts.filter = {$and : []};
            for (const [field, filter] of Object.entries(req.body.filters)){
                if(filter.type == "equals"){
                    const vOpt = {[field]: {$eq:filter.val}}
                    const sOpt = {
                        equals: {
                            path: field,
                            value: filter.val
                        }
                    }
                    vector.filter.$and.push(vOpt);
                    searchOpts.compound.filter.push(sOpt);
                }
            }
        }

        const pipeline = [
            {
              $vectorSearch: vectorOpts
            },
            {
                $group: {
                  _id: null,
                  docs: {
                    $push: "$$ROOT",
                  },
                },
              },
              {
                $unwind: {
                  path: "$docs",
                  includeArrayIndex: "rank",
                },
              },
              {
                $addFields: {
                  "docs.rank": "$rank",
                },
              },
              {
                $replaceRoot:
                  /**
                   * replacementDocument: A document or string.
                   */
                  {
                    newRoot: "$docs",
                  },
              },
              {
                $addFields: {
                  vs_score: {
                    $divide: [
                      1,
                      {
                        $add: ["$rank", 0, 1],
                      },
                    ],
                  },
                },
              },
              {
                $unionWith: {
                  coll: "docs_chunks",
                  pipeline: [
                    {
                      $search: searchOpts
                    },
                    {
                      $limit: 50,
                    },
                    {
                      $group: {
                        _id: null,
                        docs: {
                          $push: "$$ROOT",
                        },
                      },
                    },
                    {
                      $unwind: {
                        path: "$docs",
                        includeArrayIndex: "rank",
                      },
                    },
                    {
                      $addFields: {
                        "docs.rank": "$rank",
                      },
                    },
                    {
                      $replaceRoot: {
                        newRoot: "$docs",
                      },
                    },
                    {
                      $addFields: {
                        fts_score: {
                          $divide: [
                            1,
                            {
                              $add: ["$rank", 0, 1],
                            },
                          ],
                        },
                      },
                    },
                  ],
                },
              },
              {
                $addFields:{
                    vs_score: {$ifNull: ["$vs_score", 0]},
                    fts_score: {$ifNull: ["$fts_score", 0]},
                }
              },
              {
                $group: {
                  _id: "$_id",
                  vs_score: {
                    $max: "$vs_score",
                  },
                  fts_score: {
                    $max: "$fts_score",
                  },
                  lang: {
                    $first: "$lang",
                  },
                  title: {
                    $first: "$title",
                  },
                  attribution: {
                    $first: "$attribution",
                  },
                  content: {
                    $first: "$content",
                  },
                  chunk: {
                    $first: "$chunk",
                  },
                  parent_id: {
                    $first: "$parent_id",
                  },
                  link:{$first:"$link"}
                },
              },
              {
                $addFields: {
                  score: {
                    $add: ["$vs_score", "$fts_score"],
                  },
                },
              },
              {
                $sort: {
                  score: -1,
                },
              },
              {
                $group: {
                  _id: "$parent_id",
                  chunks: {
                    $push: "$$ROOT",
                  },
                  lang: {
                    $first: "$lang",
                  },
                  title: {
                    $first: "$title",
                  },
                  attribution: {
                    $first: "$attribution",
                  },
                  link:{$first:"$link"},
                  max: {
                    $max: "$score",
                  },
                  avg: {
                    $avg: "$score",
                  },
                  sum: {
                    $sum: "$score",
                  },
                  count: {
                    $count: {},
                  },
                },
              },
              {
                $project: {
                  parent: "$_id",
                  chunks: 1,
                  lang: 1,
                  attribution: 1,
                  link:1,
                  title: 1,
                  score: {
                    avg: "$avg",
                    max: "$max",
                    sum: "$sum",
                    count: "$count",
                  },
                },
              },
              {
                $sort: {
                  "score.max": -1,
                },
              },
            ]

        

        try{
            const response = await getResults(req.chunks,pipeline);
            res.status(200).json({results:response,query:pipeline});
        }catch(error){
            res.status(405).json({'error':`${error}`,query:pipeline});
        }
    }
});

export default router.handler();