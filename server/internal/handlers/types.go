package handlers

import (
	"echo/internal/service"
)

type AuthHandler struct {
	Service *service.Service
}
type UserHandler struct {
	Service *service.Service
}
type QuestionHandler struct {
	Service *service.Service
}
type ReplyHandler struct {
	Service *service.Service
}
type ChamberHandler struct {
	Service *service.Service
}
type NotificationHandler struct {
	Service *service.Service
}
type SearchHandler struct {
	Service *service.Service
}
