import express, { Request, Response, NextFunction } from 'express';

const showService = (req: Request, res: Response) => {
  return res.render('index', {
    title: 'NFTUBE Service',
    content: 'This is NFTUBE backend service.'
  });
};

export { showService };
