var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
import { success, notFound } from '../../services/response/'
import { nude, stat } from '../../services/mfc'
export const index = ({ querymen: { query, select, cursor } }, res, next) =>
  res.status(200).json([])

export const show = ({ params }, res, next) =>{
  //console.log(params.model_name)
  nude(params.model_name)
  .then(success(res))
  //.then(res.status(200).send())
  .catch(next)
}
export const status = ({ params }, res, next) =>{
  //console.log(params.model_name)
  stat(params.model_name)
  .then(success(res))
  //.then(res.status(200).send())
  .catch(next)
}
  //
  //res.status(200).json({})
