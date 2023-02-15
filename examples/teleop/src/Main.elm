port module Main exposing (main)

import Browser
import Html as H
import Html.Attributes as At
import Json.Encode as E
import Keyboard
import Keyboard.Arrows



-- PORTS


port sendBaseSetPower : E.Value -> Cmd msg


port sendBaseStop : () -> Cmd msg


port sendGetPosition : () -> Cmd msg


port recvGetPosition : (Float -> msg) -> Sub msg



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
    ( { position = 0
      , keys = []
      }
    , sendGetPosition ()
    )



-- MODEL


type alias Model =
    { position : Float
    , keys : List Keyboard.Key
    }



-- UPDATE


type Msg
    = RecvGetPosition Float
    | KeyMsg Keyboard.Msg


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        KeyMsg keyMsg ->
            let
                keys =
                    Keyboard.update keyMsg model.keys
            in
            ( { model | keys = keys }, handleBaseSetPower keys )

        RecvGetPosition position ->
            ( { model | position = position }, Cmd.none )


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
        [ recvGetPosition RecvGetPosition
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
        , viewStreamControls model
        ]


viewStreamControls : Model -> H.Html Msg
viewStreamControls model =
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
        [ viewStreams
        , viewMovementControls model
        ]


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

        -- transparency
        , At.style "opacity" "50%"

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
        , At.style "outline" "1px solid lightgrey"
        , At.style "background-color" <|
            if pressed then
                "lightgreen"

            else
                "white"

        -- size
        , At.style "width" "50px"
        , At.style "height" "50px"
        , At.style "font-size" "2rem"
        ]
        [ H.text keyText ]
