from pathlib import Path

from config.model_registry import (
    MODEL_REGISTRY,
    get_available_models,
    get_model_config,
)


def main() -> None:
    print("===== Model Registry Test =====")

    print("\nRegistered model IDs:")
    print(list(MODEL_REGISTRY.keys()))

    print("\nModels visible to users:")

    for model in get_available_models():
        print(model)

    print("\nChecking every registered weight:")

    for model_id in MODEL_REGISTRY:
        model_config = get_model_config(model_id)
        weight_path = Path(model_config["weight_path"])

        print("------------------------------")
        print("Model ID:", model_id)
        print("Name:", model_config["name"])
        print("Weight:", weight_path)
        print("Exists:", weight_path.exists())

        if not weight_path.exists():
            raise FileNotFoundError(
                f"Weight file not found: {weight_path}"
            )

    print("\nChecking invalid model ID:")

    try:
        get_model_config("wrong_model")
    except ValueError as error:
        print("Expected error:", error)
    else:
        raise RuntimeError(
            "Invalid model ID was not rejected"
        )

    print("\nModel Registry test passed successfully")


if __name__ == "__main__":
    main()