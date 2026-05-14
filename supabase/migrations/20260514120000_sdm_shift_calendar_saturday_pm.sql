-- Soporte para turnos de sábado AM y PM en sdm_shift_calendar.
-- turno_number sigue siendo el turno AM (o el turno único para días Lun-Vie/Domingo).
-- turno_number_pm es opcional y se usa para días donde hay un turno separado de tarde
-- (sábados típicamente). Si está NULL, no hay turno PM separado.

ALTER TABLE sdm_shift_calendar
  ADD COLUMN IF NOT EXISTS turno_number_pm INT;
