import { Request, Response } from 'express';
import * as crypto from 'crypto';

import { getContentsByCategory, putContent, deleteContentByHashId } from '../../service/providers/ddbProvider';
import { Content } from '../models/Content';

import logger from '../../logger';

const makeContentHashId = (title: string, number: number, creator: string): string => {
  return crypto
    .createHash('sha256')
    .update(title + number + creator)
    .digest('hex');
};

const queryContents = async (req: Request, res: Response) => {
  const category = req.params.category;

  try {
    const contents = await getContentsByCategory(category);

    return res.json({
      success: true,
      data: contents
    });
  } catch (err: any) {
    logger.error(`Error occured during queryERC721Asset with ${category}: `);
    logger.error(err.stack);
    return res.json({
      success: false,
      message: 'Failed to retrieve Contents for: ' + category
    });
  }
};

const addContent = async (req: Request, res: Response) => {
  let newContent = req.body.data;
  const { title, imageUrl, creatorAddress, number, creator } = newContent;
  if (!title || !imageUrl || !creatorAddress) {
    return res.json({
      success: false,
      message: 'Validation Error: data field title, imageUrl, creatorAddress need to exist.'
    });
  }

  newContent.hashId = makeContentHashId(title, number, creator);
  newContent.dateTime = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString();

  try {
    newContent = new Content(newContent);
    const response = await putContent(newContent);

    return res.json({
      success: true,
      data: response.makeObject()
    });
  } catch (err: any) {
    logger.error(`Error occured during addContent: `);
    logger.error(err.stack);
    return res.json({
      success: false,
      message: 'Failed to create Content for: ' + newContent
    });
  }
};

const deleteContent = async (req: Request, res: Response) => {
  const hashId = req.params.hashId;

  try {
    await deleteContentByHashId(hashId);
    return res.json({
      success: true
    });
  } catch (err: any) {
    logger.error(`Error occured during deleteContent: `);
    logger.error(err.stack);
    return res.json({
      success: false,
      message: 'Failed to delete Content for: ' + hashId
    });
  }
};

export { queryContents, addContent, deleteContent };
