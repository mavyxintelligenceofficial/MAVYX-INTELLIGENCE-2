# Mavyx Intelligence — Known Limitations
# Version 1.0.0

## AI System

| Limitation | Impact | Workaround |
|---|---|---|
| AI analysis takes 15-30 seconds | User must wait for results | Loading state shown in UI |
| GLM-4.7-Flash has rate limits on free tier | May hit 429 errors under heavy use | Default to GLM-4.5-Flash |
| AI responses may occasionally be malformed | Parsing may fail | Fallback to consensus math |
| Knowledge base is static (not RAG) | Agents can't learn new info dynamically | Manual knowledge updates |
| No multi-agent debate yet | Single-pass reasoning only | Future enhancement |
| Confidence scores are estimated, not calibrated | May not reflect true accuracy | Evaluation framework tracks this |

## Market Data

| Limitation | Impact | Workaround |
|---|---|---|
| Twelve Data free tier has rate limits | May hit limits with many requests | Redis caching (30s quotes, 5min candles) |
| Symbol typos cause 500 errors | Not user-friendly | Need better error handling |
| No real-time streaming data | Prices update on page refresh only | Refresh manually |

## Platform

| Limitation | Impact | Workaround |
|---|---|---|
| No admin endpoint to change user roles | Can't promote users to admin | Manual database update |
| No CI/CD for Python AI service tests | AI tests not in pipeline | Run manually |
| No production deployment yet | Only local development | Docker Compose available |
| No backup automation | Manual backups only | Script provided |
| No encryption at rest | Database not encrypted | Use cloud provider encryption |

## Frontend

| Limitation | Impact | Workaround |
|---|---|---|
| Basic UI design | Not production-polished | Functional, can be improved |
| No mobile-responsive optimization | May not work well on small screens | Use desktop |
| No dark mode | Light theme only | Future enhancement |
| No analysis history page in frontend | Can't view past analyses in UI | API endpoint available |

## Security

| Limitation | Impact | Workaround |
|---|---|---|
| JWT secret is a development default | Not secure for production | Change before deploying |
| No rate limiting on API endpoints | Vulnerable to abuse | Add rate limiting middleware |
| No HTTPS in development | Traffic not encrypted | Use reverse proxy in production |
| No password reset functionality | Users must remember passwords | Add reset feature |

---

**Last updated:** 2026-07-23
**Next review:** Before production deployment
