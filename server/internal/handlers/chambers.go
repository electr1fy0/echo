package handlers

import (
	"context"
	"echo/internal/middleware"
	"echo/internal/types"
	"encoding/json"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
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
	uid := uuid.New()
	var uidPg pgtype.UUID
	uidPg.Scan(uid.String())

	err = h.Service.CreateChamber(ctx, uidPg, chamber.Name, chamber.Description, sub, chamber.ColorIndex)
	if err != nil {
		respondWithError(w, "failed to create chamber", err, http.StatusInternalServerError)
		return
	}
	chamber.UID = types.UUID(uid)
	chamber.CreatorUsername = sub
	chamber.MemberCount = 1
	chamber.IsJoined = true
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(chamber)
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
			UID:         types.UUID(row.Uid.Bytes),
			Name:        row.Name,
			Description: row.Description,
			ColorIndex:  row.ColorIndex.Int32,
			TimeCreated: row.CreatedAt.Time,
			MemberCount: int(row.MemberCount),
			IsJoined:    row.IsJoined,
		}
		chambers = append(chambers, c)
	}
	json.NewEncoder(w).Encode(chambers)
}

func (h *ChamberHandler) JoinChamber(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	chamberUIDStr := r.PathValue("uid")
	var chamberUID pgtype.UUID
	chamberUID.Scan(chamberUIDStr)

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
	w.WriteHeader(http.StatusOK)
}

func (h *ChamberHandler) LeaveChamber(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	chamberUIDStr := r.PathValue("uid")
	var chamberUID pgtype.UUID
	chamberUID.Scan(chamberUIDStr)

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
	w.WriteHeader(http.StatusOK)
}
