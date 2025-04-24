  #!/bin/bash
  # start-local.sh: Start all CineRate services locally in new terminal windows

  SERVICES=("api-gateway" "user-service" "review-service" "watchlist-service")

  start_service() {
    SERVICE="$1"
    if [ ! -d "$SERVICE" ]; then
      echo "Service '$SERVICE' does not exist."
      exit 1
    fi

    echo "Starting $SERVICE in a new terminal..."
    gnome-terminal -- bash -c "cd $SERVICE && npm install && echo 'Running $SERVICE...' && node index.js; exec bash"
  }

  if [ $# -eq 0 ]; then
    for SERVICE in "${SERVICES[@]}"; do
      start_service "$SERVICE"
    done
    echo "All CineRate services are starting in separate terminals."
  else
    for SERVICE in "$@"; do
      start_service "$SERVICE"
    done
    echo "Selected services are starting in separate terminals."
  fi
