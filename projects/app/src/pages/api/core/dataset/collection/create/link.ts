import type { NextApiRequest } from 'next';
import type { LinkCreateDatasetCollectionParams } from '@fastgpt/global/core/dataset/api.d';
import { authDataset } from '@fastgpt/service/support/permission/dataset/auth';
import { createCollectionAndInsertData } from '@fastgpt/service/core/dataset/collection/controller';
import {
  TrainingModeEnum,
  DatasetCollectionTypeEnum
} from '@fastgpt/global/core/dataset/constants';
import { NextAPI } from '@/service/middleware/entry';
import { WritePermissionVal } from '@fastgpt/global/support/permission/constant';
import { type CreateCollectionResponse } from '@/global/core/dataset/api';
import { urlsFetch } from '@fastgpt/service/common/string/cheerio';
import { hashStr } from '@fastgpt/global/common/string/tools';

async function handler(req: NextApiRequest): CreateCollectionResponse {
  const { link, ...body } = req.body as LinkCreateDatasetCollectionParams;

  const { teamId, tmbId, dataset } = await authDataset({
    req,
    authToken: true,
    authApiKey: true,
    datasetId: body.datasetId,
    per: WritePermissionVal
  });

  const result = await urlsFetch({
    urlList: [link],
    selector: body?.metadata?.webPageSelector
  });
  const { title = link, content = '' } = result[0];

  if (!content || content === 'Cannot fetch internal url') {
    return Promise.reject(content || 'Can not fetch content from link');
  }

  const { collectionId, insertResults } = await createCollectionAndInsertData({
    dataset,
    rawText: content,
    createCollectionParams: {
      ...body,
      name: title || link,
      teamId,
      tmbId,
      type: DatasetCollectionTypeEnum.link,
      metadata: {
        relatedImgId: link,
        webPageSelector: body?.metadata?.webPageSelector
      },
      rawLink: link
    },

    relatedId: link
  });

  return {
    collectionId,
    results: insertResults
  };
}

export default NextAPI(handler);
