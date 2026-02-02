package handlers

import (
	"net/http"
	"strconv"
)

func parsePagination(r *http.Request) (int32, int32) {
	q := r.URL.Query()
	limitStr := q.Get("limit")
	offsetStr := q.Get("offset")
	limit := 500
	offset := 0
	var err error
	if limitStr != "" {
		limit, err = strconv.Atoi(limitStr)
		if err != nil {
			limit = 500
		}
	}
	if offsetStr != "" {
		offset, err = strconv.Atoi(offsetStr)
		if err != nil {
			offset = 0
		}
	}
	return int32(limit), int32(offset)
}
