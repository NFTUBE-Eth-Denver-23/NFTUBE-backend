import express, { Request, Response, NextFunction } from 'express';
import expressWinston from 'express-winston';
import cors from 'cors';
import path from 'path';
import createError, { HttpError } from 'http-errors';

import { initilizeRoutes } from './service/routes/router';
import logger from './logger';

const app = express();

let port = 3001;
let viewDir = '/views';
if (process.env.ENV === 'prod' || process.env.ENV === 'beta') {
  port = 80;
  viewDir = '/../views';
}

// view engine setup
app.set('views', path.join(__dirname, viewDir));
app.set('view engine', 'pug');

app.use(cors());

app.use(expressWinston.logger(logger));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));

initilizeRoutes(app);

app.listen(port, () => {
  console.log(`
    ################################################
    🛡️  Server listening on port: ${port}, ENV: ${process.env.ENV}
    ################################################
  `);
});

// catch 404 and forward to error handler
app.use(function (req: Request, res: Response, next: NextFunction) {
  next(createError(404));
});

// error handler
app.use(function (err: HttpError, req: Request, res: Response, next: NextFunction) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
