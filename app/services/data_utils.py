from datetime import date, datetime, timedelta


def semana_para_data(referencia: date) -> tuple[date, date]:
    """Limites (segunda, domingo) da semana que contém `referencia`."""
    inicio = referencia - timedelta(days=referencia.weekday())
    fim = inicio + timedelta(days=6)
    return inicio, fim


def intervalo_semana(referencia: date) -> tuple[datetime, datetime]:
    """Bounds meio-abertos [inicio, fim) da semana que contém `referencia`, como datetime."""
    inicio, fim = semana_para_data(referencia)
    inicio_dt = datetime.combine(inicio, datetime.min.time())
    fim_dt = datetime.combine(fim, datetime.min.time()) + timedelta(days=1)
    return inicio_dt, fim_dt
