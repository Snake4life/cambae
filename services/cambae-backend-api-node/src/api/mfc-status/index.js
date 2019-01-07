import { Router } from 'express'
import { middleware as query } from 'querymen'
import { token } from '../../services/passport'
import { index, show, status } from './controller'

const router = new Router()

/**
 * @api {get} /mfc-status Retrieve mfc statuses
 * @apiName RetrieveMfcStatuses
 * @apiGroup MfcStatus
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiUse listParams
 * @apiSuccess {Object[]} mfcStatuses List of mfc statuses.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 401 user access only.
 */
router.get('/',
  token({ required: true }),
  query(),
  index)

/**
 * @api {get} /mfc-status/:model_name Retrieve mfc status
 * @apiName RetrieveMfcStatus
 * @apiGroup MfcStatus
 * @apiPermission user
 * @apiParam {String} access_token user access token.
 * @apiSuccess {Object} mfcStatus Mfc status's data.
 * @apiError {Object} 400 Some parameters may contain invalid values.
 * @apiError 404 Mfc status not found.
 * @apiError 401 user access only.
 */
router.post('/:model_name',
  //token({ required: true }),
  show)

router.post('/:model_name/status',
  //token({ required: true }),
  status)
export default router
