port module Main exposing (main)

import Browser
import Html as H
import Html.Attributes as At
import Json.Decode as D
import Json.Encode as E
import Keyboard
import Keyboard.Arrows
import Time



-- PORTS


port sendBaseSetPower : E.Value -> Cmd msg


port sendBaseStop : () -> Cmd msg


port getWifiReading : () -> Cmd msg


port recvWifiReading : (Float -> msg) -> Sub msg


port getAccelReading : () -> Cmd msg


port recvAccelReading : (E.Value -> msg) -> Sub msg



-- PROGRAM


main : Program () Model Msg
main =
    Browser.element
        { init = init
        , view = view
        , update = update
        , subscriptions = subscriptions
        }


init : () -> ( Model, Cmd Msg )
init _ =
    ( { keys = []
      , signalLevel = 0
      , acceleration = { x = 0, y = 0, z = 0 }
      }
    , Cmd.none
    )



-- MODEL


type alias Model =
    { keys : List Keyboard.Key
    , signalLevel : Float
    , acceleration : Acceleration
    }


type alias Acceleration =
    { x : Float
    , y : Float
    , z : Float
    }


accelerationDecoder : D.Decoder Acceleration
accelerationDecoder =
    D.map3
        Acceleration
        (D.field "x" D.float)
        (D.field "y" D.float)
        (D.field "x" D.float)



-- UPDATE


type Msg
    = KeyMsg Keyboard.Msg
    | GetWifi
    | GotWifi Float
    | GetAcceleration
    | GotAcceleration E.Value


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        KeyMsg keyMsg ->
            let
                keys =
                    Keyboard.update keyMsg model.keys
            in
            ( { model | keys = keys }, handleBaseSetPower keys )

        GetWifi ->
            ( model, getWifiReading () )

        GotWifi signalLevel ->
            ( { model | signalLevel = signalLevel }, Cmd.none )

        GetAcceleration ->
            ( model, getAccelReading () )

        GotAcceleration value ->
            case D.decodeValue accelerationDecoder value of
                Err _ ->
                    ( model, Cmd.none )

                Ok accel ->
                    ( { model | acceleration = accel }, Cmd.none )


handleBaseSetPower : List Keyboard.Key -> Cmd none
handleBaseSetPower keys =
    let
        wasd =
            Keyboard.Arrows.wasd keys

        arrows =
            Keyboard.Arrows.arrows keys

        { x, y } =
            if wasd.x /= 0 || wasd.y /= 0 then
                wasd

            else
                arrows
    in
    if x == 0 && y == 0 then
        sendBaseStop ()

    else
        sendBaseSetPower <|
            E.object
                [ ( "linear", E.float <| 0.1 * toFloat y * defaultPower )
                , ( "angular", E.float <| 0.1 * toFloat -x * defaultPower )
                ]


defaultPower : number
defaultPower =
    50



-- SUBSCRIPTIONS


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.batch
        [ Time.every 1000 (\_ -> GetWifi)
        , recvWifiReading GotWifi
        , Time.every 1000 (\_ -> GetAcceleration)
        , recvAccelReading GotAcceleration
        , Sub.map KeyMsg Keyboard.subscriptions
        ]



-- VIEWS


view : Model -> H.Html Msg
view model =
    H.div
        [ -- flex
          At.style "display" "flex"
        , At.style "flex-direction" "column"
        , At.style "justify-content" "center"
        , At.style "align-items" "center"
        , At.style "row-gap" "0.5rem"
        ]
        [ H.h2 [] <| [ H.text "Tele-Op Demo" ]
        , viewHUD model
        ]


viewHUD : Model -> H.Html Msg
viewHUD model =
    H.div
        [ --flex
          At.style "display" "flex"
        , At.style "flex-direction" "column"
        , At.style "justify-content" "center"
        , At.style "align-items" "center"

        -- overlay
        , At.style "position" "relative"
        , At.style "width" "100%"
        , At.style "height" "100%"

        -- size
        , At.style "width" "600px"
        , At.style "height" "480px"
        ]
        -- TODO: automatically make these `position:absolute`
        [ viewWifiSignal model
        , viewStreams
        , viewMovementControls model
        , viewAcceleration model
        ]


viewAcceleration : Model -> H.Html Msg
viewAcceleration model =
    H.div
        [ -- overlay
          At.style "top" "0"
        , At.style "right" "0"
        , At.style "position" "absolute"
        , At.style "z-index" "10"

        -- color
        , At.style "color" <| statsColor

        -- contrast
        , At.style "background-color" "rgba(255,255,255,0.5)"
        , At.style "padding" "0.25rem"

        --flex
        , At.style "display" "flex"
        , At.style "flex-direction" "column"
        , At.style "align-items" "flex-start"
        , At.style "row-gap" "1rem"
        , At.style "width" "80px"
        ]
        [ H.div [] [ H.text <| "X: " ++ formatAccelerationDim model.acceleration.x ]
        , H.div [] [ H.text <| "Y: " ++ formatAccelerationDim model.acceleration.y ]
        , H.div [] [ H.text <| "Z: " ++ formatAccelerationDim model.acceleration.z ]
        ]


formatAccelerationDim : Float -> String
formatAccelerationDim dim =
    String.fromFloat <| ((toFloat << round) (100 * dim) / 100)


viewWifiSignal : Model -> H.Html Msg
viewWifiSignal model =
    H.div
        [ -- overlay
          At.style "top" "0"
        , At.style "left" "0"
        , At.style "position" "absolute"
        , At.style "z-index" "10"

        -- color
        , At.style "color" <| statsColor

        -- contrast
        , At.style "background-color" "rgba(255,255,255,0.5)"
        , At.style "opacity" "50%"
        , At.style "padding" "0.25rem"

        --flex
        , At.style "display" "flex"
        , At.style "column-gap" "1rem"
        ]
        [ viewWifiSignalBars model
        , H.text <| "(" ++ String.fromFloat model.signalLevel ++ " dBm)"
        ]


viewWifiSignalBars : Model -> H.Html Msg
viewWifiSignalBars model =
    let
        level =
            if model.signalLevel >= -50 then
                5

            else if model.signalLevel >= -60 then
                4

            else if model.signalLevel >= -67 then
                3

            else if model.signalLevel >= -70 then
                2

            else if model.signalLevel >= -80 then
                1

            else
                0
    in
    H.div
        [ --flex
          At.style "display" "flex"
        , At.style "justify-content" "center"
        , At.style "align-items" "flex-end"
        , At.style "column-gap" "0.25rem"
        ]
    <|
        List.map viewWifiSignalBar <|
            List.map (Tuple.pair level) [ 1, 2, 3, 4, 5 ]


viewWifiSignalBar : ( Int, Int ) -> H.Html Msg
viewWifiSignalBar ( level, minLevel ) =
    H.div
        [ --flex
          At.style "width" "5px"
        , At.style "height" <| (String.fromFloat <| toFloat minLevel / 5.0) ++ "rem"
        , At.style "background-color" <|
            if level >= minLevel then
                statsColor

            else
                "transparent"
        , At.style "border" <| "1px solid " ++ statsColor
        , At.style "z-index" "20"
        ]
    <|
        []


statsColor : String
statsColor =
    "black"


viewStreams : H.Html Msg
viewStreams =
    H.div
        [ --flex
          At.style "display" "flex"
        , At.style "justify-content" "center"
        , At.style "align-items" "center"

        -- overlay
        , At.style "top" "0"
        , At.style "position" "absolute"
        ]
        [ -- Camera stream inserted here
          H.div
            [ At.attribute "data-stream" "cam"
            ]
            []
        ]


viewMovementControls : Model -> H.Html Msg
viewMovementControls model =
    H.div
        [ -- flex
          At.style "display" "flex"
        , At.style "justify-content" "center"
        , At.style "align-items" "center"

        -- overlay
        , At.style "position" "absolute"
        , At.style "bottom" "5%"
        , At.style "column-gap" "85%"
        ]
        [ viewWASD model
        , viewArrows model
        ]


viewArrows : Model -> H.Html Msg
viewArrows model =
    H.div
        [ At.style "display" "grid"
        , At.style "grid-template-columns" "repeat(3, 1fr)"
        ]
        [ viewKey (Keyboard.Character "") model.keys
        , viewKey Keyboard.ArrowUp model.keys
        , viewKey (Keyboard.Character "") model.keys
        , viewKey Keyboard.ArrowLeft model.keys
        , viewKey Keyboard.ArrowDown model.keys
        , viewKey Keyboard.ArrowRight model.keys
        ]


viewWASD : Model -> H.Html Msg
viewWASD model =
    H.div
        [ At.style "display" "grid"
        , At.style "grid-template-columns" "repeat(3, 1fr)"
        ]
        [ viewKey (Keyboard.Character "") model.keys
        , viewKey (Keyboard.Character "W") model.keys
        , viewKey (Keyboard.Character "") model.keys
        , viewKey (Keyboard.Character "A") model.keys
        , viewKey (Keyboard.Character "S") model.keys
        , viewKey (Keyboard.Character "D") model.keys
        ]


viewKey : Keyboard.Key -> List Keyboard.Key -> H.Html Msg
viewKey key keys =
    let
        pressed =
            List.member key keys

        keyText =
            case key of
                Keyboard.Character char ->
                    char

                Keyboard.ArrowUp ->
                    "▲"

                Keyboard.ArrowDown ->
                    "▼"

                Keyboard.ArrowLeft ->
                    "◄"

                Keyboard.ArrowRight ->
                    "►"

                _ ->
                    ""
    in
    H.div
        [ -- flex
          At.style "display" "flex"
        , At.style "flex-direction" "column"
        , At.style "justify-content" "center"
        , At.style "align-items" "center"

        -- color
        , At.style "border" "1px solid lightgrey"
        , At.style "background-color" <|
            if pressed then
                "lightgreen"

            else
                "rgba(255,255,255,0.5)"

        -- size
        , At.style "width" "50px"
        , At.style "height" "50px"
        , At.style "font-size" "2rem"
        ]
        [ H.text keyText ]
