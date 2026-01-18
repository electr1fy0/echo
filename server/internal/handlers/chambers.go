package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type Chamber struct {
	UID             string `json:"uid"`
	Name            string `json:"name"`
	Description     string `json:"description"`
	CreatorUsername string `json:"creatorUsername"`
	MemberCount     int    `json:"memberCount"`
	IsJoined        bool   `json:"isJoined"`
	ColorIndex      int    `json:"colorIndex"`
}

func (h *APIHandler) CreateChamber(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	var chamber Chamber

	if err := json.NewDecoder(r.Body).Decode(&chamber); err != nil {
		h.respondWithError(w, "failed to decode chamber body", err, http.StatusBadRequest)
		return
	}
	claims, ok := r.Context().Value("claims").(jwt.MapClaims)
	if !ok {
		h.respondWithError(w, "no claims", nil, http.StatusUnauthorized)
		return
	}
	sub := claims["sub"].(string)
	if sub == "" {
		h.respondWithError(w, "no sub", nil, http.StatusUnauthorized)
		return
	}

	uid := uuid.New()
	_, err := h.DB.Exec(ctx, "insert into chambers (uid, name, description, creator_username, color_index) values ($1, $2, $3, $4, $5)", uid, chamber.Name, chamber.Description, sub, chamber.ColorIndex)
	if err != nil {
		h.respondWithError(w, "failed to create chamber", err, http.StatusInternalServerError)
		return
	}

	_, err = h.DB.Exec(ctx, "insert into chamber_members (chamber_uid, username) values ($1, $2)", uid, sub)
	if err != nil {
		h.respondWithError(w, "failed to auto-join creator", err, http.StatusInternalServerError)
		return
	}

	chamber.UID = uid.String()
	chamber.CreatorUsername = sub
	chamber.MemberCount = 1
	chamber.IsJoined = true

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(chamber)
}

func (h *APIHandler) DeleteChamber(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	var chamber Chamber

	if err := json.NewDecoder(r.Body).Decode(&chamber); err != nil {
		h.respondWithError(w, "failed to decode chamber body", err, http.StatusBadRequest)
		return
	}
	claims, ok := r.Context().Value("claims").(jwt.MapClaims)
	if !ok {
		h.respondWithError(w, "no claims", nil, http.StatusUnauthorized)
		return
	}
	sub := claims["sub"].(string)
	if sub == "" {
		h.respondWithError(w, "no sub", nil, http.StatusUnauthorized)
		return
	}

	_, err := h.DB.Exec(ctx, "delete from chambers where creator_username = $1 and name = $2", sub, chamber.Name)
	if err != nil {
		h.respondWithError(w, "failed to delete chamber", err, http.StatusInternalServerError)
		return
	}
}

func (h *APIHandler) ListChambers(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	var chambers []Chamber = make([]Chamber, 0)

	claims, ok := r.Context().Value("claims").(jwt.MapClaims)
	if !ok {
		h.respondWithError(w, "no claims", nil, http.StatusUnauthorized)
		return
	}
	sub := claims["sub"].(string)
	if sub == "" {
		h.respondWithError(w, "no sub", nil, http.StatusUnauthorized)
		return
	}

	q := r.URL.Query()
	filterQuery := q.Get("q")

	baseQuery := `
		SELECT 
			c.uid, 
			c.name, 
			COALESCE(c.description, ''), 
			c.color_index,
			(SELECT COUNT(*) FROM chamber_members cm WHERE cm.chamber_uid = c.uid) as member_count,
			EXISTS(SELECT 1 FROM chamber_members cm WHERE cm.chamber_uid = c.uid AND cm.username = $1) as is_joined
		FROM chambers c
	`

	var rows pgx.Rows
	var err error

	if filterQuery != "" {
		baseQuery += " WHERE c.name ILIKE $2 OR c.description ILIKE $2"
		rows, err = h.DB.Query(ctx, baseQuery, sub, "%"+filterQuery+"%")
	} else {
		rows, err = h.DB.Query(ctx, baseQuery, sub)
	}

	if err != nil {
		h.respondWithError(w, "failed to query chambers", err, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var c Chamber
		if err := rows.Scan(&c.UID, &c.Name, &c.Description, &c.ColorIndex, &c.MemberCount, &c.IsJoined); err != nil {
			continue
		}
		chambers = append(chambers, c)
	}

	json.NewEncoder(w).Encode(chambers)
}

func (h *APIHandler) JoinChamber(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	chamberUID := r.PathValue("uid")
	claims, ok := r.Context().Value("claims").(jwt.MapClaims)
	if !ok {
		h.respondWithError(w, "no claims", nil, http.StatusUnauthorized)
		return
	}
	sub := claims["sub"].(string)

	_, err := h.DB.Exec(ctx, "INSERT INTO chamber_members (chamber_uid, username) VALUES ($1, $2) ON CONFLICT DO NOTHING", chamberUID, sub)
	if err != nil {
		h.respondWithError(w, "failed to join chamber", err, http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (h *APIHandler) LeaveChamber(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	chamberUID := r.PathValue("uid")
	claims, ok := r.Context().Value("claims").(jwt.MapClaims)
	if !ok {
		h.respondWithError(w, "no claims", nil, http.StatusUnauthorized)
		return
	}
	sub := claims["sub"].(string)

	_, err := h.DB.Exec(ctx, "DELETE FROM chamber_members WHERE chamber_uid = $1 AND username = $2", chamberUID, sub)
	if err != nil {
		h.respondWithError(w, "failed to leave chamber", err, http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}
