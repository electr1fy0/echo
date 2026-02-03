package handlers

import (
	"context"
	"echo/internal/middleware"
	"echo/internal/types"
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
)

func (h *ChamberHandler) CreateChamber(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	var chamber types.Chamber
	if err := json.NewDecoder(r.Body).Decode(&chamber); err != nil {
		respondWithError(w, "failed to decode chamber body", err, http.StatusBadRequest)
		return
	}
	sub, err := middleware.GetUserID(r.Context())
	if err != nil {
		respondWithError(w, "unauthorized", err, http.StatusUnauthorized)
		return
	}

	newUID, err := h.Service.CreateChamber(ctx, chamber.Name, chamber.Description, sub, chamber.ColorIndex)
	if err != nil {
		respondWithError(w, "failed to create chamber", err, http.StatusInternalServerError)
		return
	}
	chamber.UID = newUID
	chamber.CreatorUsername = sub
	chamber.MemberCount = 1
	chamber.IsJoined = true
	
	respondWithJSON(w, http.StatusCreated, chamber)
}

func (h *ChamberHandler) DeleteChamber(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	var chamber types.Chamber
	if err := json.NewDecoder(r.Body).Decode(&chamber); err != nil {
		respondWithError(w, "failed to decode chamber body", err, http.StatusBadRequest)
		return
	}
	sub, err := middleware.GetUserID(r.Context())
	if err != nil {
		respondWithError(w, "unauthorized", err, http.StatusUnauthorized)
		return
	}
	err = h.Service.DeleteChamber(ctx, sub, chamber.Name)
	if err != nil {
		respondWithError(w, "failed to delete chamber", err, http.StatusInternalServerError)
		return
	}
	respondWithJSON(w, http.StatusOK, map[string]string{"message": "chamber deleted"})
}

func (h *ChamberHandler) ListChambers(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	var chambers []types.Chamber = make([]types.Chamber, 0)
	sub, err := middleware.GetUserID(r.Context())
	if err != nil {
		respondWithError(w, "unauthorized", err, http.StatusUnauthorized)
		return
	}
	q := r.URL.Query()
	filterQuery := q.Get("q")

	rows, err := h.Service.ListChambers(ctx, filterQuery, sub)
	if err != nil {
		respondWithError(w, "failed to query chambers", err, http.StatusInternalServerError)
		return
	}

	for _, row := range rows {
		c := types.Chamber{
			UID:         uuid.UUID(row.Uid.Bytes).String(),
			Name:        row.Name,
			Description: row.Description,
			CreatorUsername: row.CreatorUsername.String,
			ColorIndex:  row.ColorIndex.Int32,
			TimeCreated: row.CreatedAt.Time,
			MemberCount: int(row.MemberCount),
			IsJoined:    row.IsJoined,
		}
		chambers = append(chambers, c)
	}
	respondWithJSON(w, http.StatusOK, chambers)
}

func (h *ChamberHandler) JoinChamber(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	chamberUID := r.PathValue("uid")
	if chamberUID == "" {
		respondWithError(w, "invalid uid", nil, http.StatusBadRequest)
		return
	}

	sub, err := middleware.GetUserID(r.Context())
	if err != nil {
		respondWithError(w, "unauthorized", err, http.StatusUnauthorized)
		return
	}

	err = h.Service.JoinChamber(ctx, chamberUID, sub)
	if err != nil {
		respondWithError(w, "failed to join chamber", err, http.StatusInternalServerError)
		return
	}
	respondWithJSON(w, http.StatusOK, map[string]string{"message": "joined chamber"})
}

func (h *ChamberHandler) LeaveChamber(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	chamberUID := r.PathValue("uid")
	if chamberUID == "" {
		respondWithError(w, "invalid uid", nil, http.StatusBadRequest)
		return
	}

	sub, err := middleware.GetUserID(r.Context())
	if err != nil {
		respondWithError(w, "unauthorized", err, http.StatusUnauthorized)
		return
	}

	err = h.Service.LeaveChamber(ctx, chamberUID, sub)
	if err != nil {
		respondWithError(w, "failed to leave chamber", err, http.StatusInternalServerError)
		return
	}
	respondWithJSON(w, http.StatusOK, map[string]string{"message": "left chamber"})
}

func (h *ChamberHandler) UpdateChamber(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	defer r.Body.Close()

	uid := r.PathValue("uid")
	if uid == "" {
		respondWithError(w, "invalid uid", nil, http.StatusBadRequest)
		return
	}

	var chamber types.Chamber
	if err := json.NewDecoder(r.Body).Decode(&chamber); err != nil {
		respondWithError(w, "failed to decode chamber body", err, http.StatusBadRequest)
		return
	}

	sub, err := middleware.GetUserID(r.Context())
	if err != nil {
		respondWithError(w, "unauthorized", err, http.StatusUnauthorized)
		return
	}

	if chamber.Name == "" || chamber.Description == "" {
		respondWithError(w, "name and description are required", nil, http.StatusBadRequest)
		return
	}

	err = h.Service.UpdateChamber(ctx, uid, sub, chamber)
	if err != nil {
		if err.Error() == "unauthorized" {
			respondWithError(w, "unauthorized", nil, http.StatusForbidden)
		} else if err.Error() == "chamber not found" {
			respondWithError(w, "chamber not found", nil, http.StatusNotFound)
		} else if err.Error() == "invalid uid" {
			respondWithError(w, "invalid uid", nil, http.StatusBadRequest)
		} else {
			var pgErr *pgconn.PgError
			if errors.As(err, &pgErr) && pgErr.Code == "23505" {
				respondWithError(w, "chamber name already exists", nil, http.StatusConflict)
			} else {
				respondWithError(w, "failed to update chamber", err, http.StatusInternalServerError)
			}
		}
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]string{"message": "chamber updated"})
}
