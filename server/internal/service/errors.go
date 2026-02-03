package service

import "errors"

var (
	ErrUnauthorized       = errors.New("unauthorized")
	ErrInvalidUID         = errors.New("invalid uid")
	ErrInvalidQuestionUID = errors.New("invalid question uid")
	ErrInvalidReplyUID    = errors.New("invalid reply uid")
	ErrQuestionNotFound   = errors.New("question not found")
	ErrReplyNotFound      = errors.New("reply not found")
	ErrChamberNotFound    = errors.New("chamber not found")
)
