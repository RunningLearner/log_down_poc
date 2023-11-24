import archiver from "archiver";
import express from "express";
import path from "path";
import url from "url";
import winston, { format as _format, createLogger } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const app = express();
const port = 3000;

let isLogging = false; // 무한 로깅 제어를 위한 플래그

// Winston 로거 설정
const logger = createLogger({
    level: "info",
    format: _format.json(),
    // transports: [
    //     //
    //     // - 파일에 로그를 기록합니다.
    //     //
    //     new _transports.File({ filename: "error.log", level: "error" }),
    //     new _transports.File({ filename: "combined.log" }),
    // ],
    transports: [
        new DailyRotateFile({
            filename: "logs/application-%DATE%.log",
            datePattern: "YYYY-MM-DD",
            zippedArchive: true,
            maxSize: "20m",
            maxFiles: "14d",
        }),
        new winston.transports.Console({
            format: winston.format.simple(),
        }),
    ],
});

app.use(express.static("public"));

// 간단한 요청 처리
app.get("/", (req, res) => {
    res.sendFile("/public/index.html", { root: __dirname });
});

// 로그 파일 다운로드 엔드포인트
app.get("/download-logs", (req, res) => {
    const logFolderPath = path.join(__dirname, "/logs");
    const archive = archiver("zip", { zlib: { level: 9 } });

    res.attachment("logs.zip");

    archive.pipe(res);
    archive.directory(logFolderPath, false);
    archive.finalize();
});

// 무한 로깅 시작
app.get("/startlog", (req, res) => {
    isLogging = true;
    res.send("무한 로깅 시작!");
    logContinuously();
});

// 무한 로깅 중단
app.get("/stoplog", (req, res) => {
    isLogging = false;
    res.send("무한 로깅 중단!");
});

// 무한 로깅 함수
function logContinuously() {
    if (isLogging) {
        logger.info(`${Date.now()} 무한로깅`);
        setTimeout(logContinuously, 500);
    }
}

// 서버 시작
app.listen(port, () => {
    console.log(`Express 서버가 http://localhost:${port} 에서 실행중입니다.`);
    logger.info(`서버 시작, 포트: ${port}`);
});

// 오류 처리
app.use((err, req, res, next) => {
    logger.error(`${err.stack}`);
    res.status(500).send("서버 에러 발생!");
});
