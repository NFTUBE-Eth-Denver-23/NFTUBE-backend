import { Request, Response } from 'express';
import logger from '../../logger';
import { baseFetchGet } from '../providers/externalProvider';

const fetchExternalImageMetadata = async (req: Request, res: Response) => {
  const endpoint = req.query.ENDPOINT as string;

  try {
    const data = await baseFetchGet(endpoint);

    return res.json({
      success: true,
      data: data
    })
  } catch (err: any) {
    logger.error(`Error occured during fetchExternalImageMetadata: `);
    logger.error(err.stack);

    return res.json({
      success: false,
      message: `Error occured during fetchExternalImageMetadata.`
    });
  }
}

export {
  fetchExternalImageMetadata
}